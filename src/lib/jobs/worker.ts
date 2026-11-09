import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { leads, searches, activities, jobs as jobsTable } from "@/lib/db/schema";
import { getSetting } from "@/lib/db/settings";
import { safeJsonParse } from "@/lib/utils";
import { discoverForNiche, discoverSimilar, ManualImportSource, isBlockedDomain } from "@/lib/discovery";
import { analyzeDomain } from "@/lib/crawler/analyze";
import { closeBrowser } from "@/lib/crawler/fetch";
import {
  claimNextJob,
  recoverInterruptedJobs,
  updateJob,
  enqueueJob,
} from "./queue";
import { emitJobEvent } from "./events";

const globalWorker = globalThis as unknown as {
  __supplyscoutWorkerStarted?: boolean;
  __supplyscoutWorkerTimer?: NodeJS.Timeout;
  __supplyscoutActive?: Set<string>;
};

function activeSet() {
  if (!globalWorker.__supplyscoutActive) globalWorker.__supplyscoutActive = new Set();
  return globalWorker.__supplyscoutActive;
}

async function runDiscover(jobId: string, payload: Record<string, unknown>) {
  const db = getDb();
  const searchId = String(payload.searchId || "");
  const niche = String(payload.niche || "");
  const keywords = (payload.keywords as string[]) || [];
  const sources = (payload.sources as string[]) || [];
  const targetCount = Number(payload.targetCount || 50);
  const manualText = String(payload.manualText || "");

  const log = (message: string, data?: Record<string, unknown>) => {
    emitJobEvent({ type: "log", jobId, message, data });
    updateJob(jobId, {
      progress: { message, ...(data || {}) },
    });
  };

  if (searchId) {
    db.update(searches).set({ status: "running" }).where(eq(searches.id, searchId)).run();
  }

  let candidates: Array<{ domain: string; source: string }> = [];

  if (manualText.trim()) {
    const manual = new ManualImportSource().fromText(manualText);
    candidates = manual.filter((c) => !isBlockedDomain(c.domain));
    log(`Manual import: ${candidates.length} domains`);
  }

  if (sources.includes("brave") || sources.includes("serpapi") || sources.includes("google_cse") || sources.length === 0) {
    const apiCandidates = await discoverForNiche({
      niche,
      keywords,
      sources: sources.filter((s) => s !== "manual"),
      targetCount,
      onProgress: (msg, collected) => log(msg, { discovered: collected.length }),
    });
    candidates = [...candidates, ...apiCandidates];
  }

  // dedupe
  const seen = new Set<string>();
  candidates = candidates.filter((c) => {
    if (seen.has(c.domain)) return false;
    seen.add(c.domain);
    return true;
  }).slice(0, targetCount);

  log(`Discovered ${candidates.length} unique domains — enqueueing crawls`);

  let created = 0;
  for (const c of candidates) {
    const existing = db.select().from(leads).where(eq(leads.domain, c.domain)).get();
    let leadId = existing?.id;
    if (!existing) {
      leadId = uuid();
      db.insert(leads)
        .values({
          id: leadId,
          domain: c.domain,
          niche,
          searchId: searchId || null,
          firstSeenAt: Date.now(),
          pipelineStatus: "new",
        })
        .run();
      created += 1;
    }
    enqueueJob({
      type: "crawl",
      payload: { domain: c.domain, niche, searchId },
      searchId: searchId || undefined,
      leadId,
    });
  }

  if (searchId) {
    db.update(searches)
      .set({
        status: "completed",
        stats: JSON.stringify({ discovered: candidates.length, created }),
      })
      .where(eq(searches.id, searchId))
      .run();
  }

  updateJob(jobId, {
    status: "completed",
    finishedAt: Date.now(),
    progress: { message: `Discovery complete: ${candidates.length} domains`, discovered: candidates.length, created },
  });
  log(`Discovery complete: ${candidates.length} domains (${created} new)`);
}

async function runCrawl(jobId: string, payload: Record<string, unknown>, leadId?: string | null) {
  const domain = String(payload.domain || "");
  const niche = payload.niche ? String(payload.niche) : undefined;
  const searchId = payload.searchId ? String(payload.searchId) : undefined;

  const result = await analyzeDomain(domain, {
    leadId: leadId || undefined,
    searchId,
    niche,
    onProgress: (message) => {
      emitJobEvent({ type: "log", jobId, message });
      updateJob(jobId, { progress: { message, domain } });
    },
  });

  updateJob(jobId, {
    status: result.error && !result.blocked ? "failed" : "completed",
    finishedAt: Date.now(),
    error: result.error || null,
    progress: { message: result.error || `Scored ${result.score}`, ...result },
  });
}

async function runSimilar(jobId: string, payload: Record<string, unknown>) {
  const db = getDb();
  const leadId = String(payload.leadId || "");
  const lead = db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) {
    updateJob(jobId, { status: "failed", error: "Lead not found", finishedAt: Date.now() });
    return;
  }
  const categories = safeJsonParse<string[]>(lead.categories, []);
  const found = await discoverSimilar({
    niche: lead.niche,
    categories,
    brandKeywords: lead.companyName ? [lead.companyName] : [],
    targetCount: Number(payload.targetCount || 20),
  });

  for (const c of found) {
    if (c.domain === lead.domain) continue;
    const existing = db.select().from(leads).where(eq(leads.domain, c.domain)).get();
    let newLeadId = existing?.id;
    if (!existing) {
      newLeadId = uuid();
      db.insert(leads)
        .values({
          id: newLeadId,
          domain: c.domain,
          niche: lead.niche,
          firstSeenAt: Date.now(),
          pipelineStatus: "new",
          tags: JSON.stringify(["similar"]),
        })
        .run();
    }
    enqueueJob({
      type: "crawl",
      payload: { domain: c.domain, niche: lead.niche },
      leadId: newLeadId,
    });
  }

  db.insert(activities)
    .values({
      id: uuid(),
      leadId: lead.id,
      type: "similar",
      body: `Enqueued ${found.length} similar domains`,
      createdAt: Date.now(),
    })
    .run();

  updateJob(jobId, {
    status: "completed",
    finishedAt: Date.now(),
    progress: { message: `Similar expansion: ${found.length}`, count: found.length },
  });
}

async function processJob(job: NonNullable<ReturnType<typeof claimNextJob>>) {
  const payload = safeJsonParse<Record<string, unknown>>(job.payload, {});
  activeSet().add(job.id);
  emitJobEvent({ type: "status", jobId: job.id, message: "running", data: { status: "running", type: job.type } });

  try {
    const fresh = getDb().select().from(jobsTable).where(eq(jobsTable.id, job.id)).get();
    if (fresh?.status === "cancelled" || fresh?.status === "paused") return;

    if (job.type === "discover") await runDiscover(job.id, payload);
    else if (job.type === "crawl") await runCrawl(job.id, payload, job.leadId);
    else if (job.type === "similar") await runSimilar(job.id, payload);
    else if (job.type === "enrich" || job.type === "llm") {
      // enrich is handled inside crawl; keep as alias to crawl
      await runCrawl(job.id, payload, job.leadId);
    } else {
      updateJob(job.id, { status: "failed", error: `Unknown job type ${job.type}`, finishedAt: Date.now() });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateJob(job.id, { status: "failed", error: message, finishedAt: Date.now() });
    emitJobEvent({ type: "log", jobId: job.id, message: `Job failed: ${message}` });
  } finally {
    activeSet().delete(job.id);
  }
}

export function ensureWorkerStarted() {
  if (globalWorker.__supplyscoutWorkerStarted) return;
  globalWorker.__supplyscoutWorkerStarted = true;

  recoverInterruptedJobs();
  emitJobEvent({ type: "log", message: "Job worker started" });

  const tick = async () => {
    try {
      const concurrency = parseInt(getSetting("job_concurrency", "2"), 10) || 2;
      while (activeSet().size < concurrency) {
        const job = claimNextJob(concurrency);
        if (!job) break;
        // fire and forget; concurrency gated by activeSet + claim
        void processJob(job);
      }
    } catch (err) {
      emitJobEvent({
        type: "log",
        message: `Worker tick error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  globalWorker.__supplyscoutWorkerTimer = setInterval(tick, 1000);
  void tick();

  // best-effort browser cleanup on exit
  process.on("beforeExit", () => {
    void closeBrowser();
  });
}
