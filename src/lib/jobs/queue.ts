import { v4 as uuid } from "uuid";
import { and, eq, inArray, lte, or, isNull, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { emitJobEvent } from "./events";
import { safeJsonParse } from "@/lib/utils";

export type JobType = "discover" | "crawl" | "enrich" | "llm" | "similar";

export function enqueueJob(opts: {
  type: JobType;
  payload?: Record<string, unknown>;
  searchId?: string;
  leadId?: string;
  runAfter?: number;
}) {
  const db = getDb();
  const now = Date.now();
  const id = uuid();
  db.insert(jobs)
    .values({
      id,
      type: opts.type,
      payload: JSON.stringify(opts.payload ?? {}),
      status: "pending",
      attempts: 0,
      progress: JSON.stringify({}),
      runAfter: opts.runAfter ?? now,
      searchId: opts.searchId,
      leadId: opts.leadId,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  emitJobEvent({ type: "job", jobId: id, message: `Enqueued ${opts.type}`, data: { status: "pending" } });
  return id;
}

export function updateJob(
  id: string,
  patch: Partial<{
    status: string;
    error: string | null;
    progress: Record<string, unknown>;
    attempts: number;
    startedAt: number;
    finishedAt: number;
    runAfter: number;
  }>
) {
  const db = getDb();
  const current = db.select().from(jobs).where(eq(jobs.id, id)).get();
  if (!current) return;
  db.update(jobs)
    .set({
      status: patch.status ?? current.status,
      error: patch.error === undefined ? current.error : patch.error,
      progress: patch.progress ? JSON.stringify(patch.progress) : current.progress,
      attempts: patch.attempts ?? current.attempts,
      startedAt: patch.startedAt ?? current.startedAt,
      finishedAt: patch.finishedAt ?? current.finishedAt,
      runAfter: patch.runAfter ?? current.runAfter,
      updatedAt: Date.now(),
    })
    .where(eq(jobs.id, id))
    .run();
  emitJobEvent({
    type: "status",
    jobId: id,
    message: patch.status || current.status || "",
    data: { ...(patch.progress || safeJsonParse(current.progress, {})), status: patch.status || current.status },
  });
}

export function claimNextJob(concurrency: number): typeof jobs.$inferSelect | null {
  const db = getDb();
  const running = db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "running"))
    .all().length;
  if (running >= concurrency) return null;

  const now = Date.now();
  const next = db
    .select()
    .from(jobs)
    .where(
      and(
        inArray(jobs.status, ["pending", "resumed"]),
        or(isNull(jobs.runAfter), lte(jobs.runAfter, now))
      )
    )
    .orderBy(asc(jobs.createdAt))
    .get();

  if (!next) return null;

  db.update(jobs)
    .set({
      status: "running",
      startedAt: next.startedAt ?? now,
      updatedAt: now,
      attempts: (next.attempts ?? 0) + 1,
    })
    .where(eq(jobs.id, next.id))
    .run();

  return { ...next, status: "running", attempts: (next.attempts ?? 0) + 1 };
}

export function pauseJob(id: string) {
  updateJob(id, { status: "paused" });
}

export function resumeJob(id: string) {
  updateJob(id, { status: "resumed", runAfter: Date.now() });
}

export function cancelJob(id: string) {
  updateJob(id, { status: "cancelled", finishedAt: Date.now() });
}

export function listJobs(limit = 100) {
  const db = getDb();
  return db.select().from(jobs).orderBy(asc(jobs.createdAt)).all().slice(-limit).reverse();
}

export function recoverInterruptedJobs() {
  const db = getDb();
  const interrupted = db.select().from(jobs).where(eq(jobs.status, "running")).all();
  for (const j of interrupted) {
    db.update(jobs)
      .set({ status: "pending", updatedAt: Date.now(), error: "Recovered after restart" })
      .where(eq(jobs.id, j.id))
      .run();
    emitJobEvent({
      type: "status",
      jobId: j.id,
      message: "Recovered after restart — pending",
      data: { status: "pending" },
    });
  }
  return interrupted.length;
}
