import { coverLetter } from "./letter.js";
import { buildEml, subjectFor } from "./draft.js";
import { searchJobs } from "./search.js";
import { summarize } from "./text.js";

function bucket(status) {
  if (status === "applied" || status === "skipped") return 1;
  return 0;
}

export function sortJobs(jobs) {
  return [...jobs].sort(
    (a, b) => bucket(a.status) - bucket(b.status) || b.matchScore - a.matchScore,
  );
}

export function mergeJobs(existing, incoming, now = new Date().toISOString()) {
  const byId = new Map(existing.map((job) => [job.id, job]));
  let added = 0;
  for (const job of incoming) {
    const previous = byId.get(job.id);
    const summary = job.summary || summarize(job.description);
    if (!previous) {
      byId.set(job.id, {
        ...job,
        summary,
        status: "new",
        coverLetter: "",
        draftFile: "",
        firstSeenAt: job.firstSeenAt || now,
      });
      added += 1;
      continue;
    }
    byId.set(job.id, {
      ...previous,
      source: job.source || previous.source,
      title: job.title || previous.title,
      company: job.company || previous.company,
      location: job.location || previous.location,
      url: job.url || previous.url,
      postedAt: job.postedAt || previous.postedAt,
      description: job.description || previous.description,
      summary: summary || previous.summary,
      contactName: job.contactName || previous.contactName,
      contactEmail: job.contactEmail || previous.contactEmail,
      matchScore: job.matchScore,
      matchedTerms: job.matchedTerms,
    });
  }
  return { jobs: sortJobs([...byId.values()]), added };
}

async function ensureResumeFile(store, state) {
  if (state.profile.resumeFile && (await store.readResume(state.profile.resumeFile))) return;
  const text = state.profile.rawText || "";
  if (!text.trim()) return;
  state.profile.resumeFile = await store.saveResume(Buffer.from(text, "utf8"), "txt");
}

export async function writeDrafts(state, store, { limit = 8, minimumScore = 25 } = {}) {
  await ensureResumeFile(store, state);
  const attachment = await store.readResume(state.profile.resumeFile);
  const targets = state.jobs
    .filter((job) => job.status === "new" && !job.coverLetter && job.matchScore >= minimumScore)
    .slice(0, limit);
  for (const job of targets) {
    job.coverLetter = coverLetter({
      profile: state.profile,
      job,
      hasResume: Boolean(attachment),
    });
    job.draftFile = await store.saveDraft(
      job.id,
      buildEml({
        fromName: state.profile.name,
        fromEmail: state.profile.email,
        to: job.contactEmail || "",
        subject: subjectFor(job, state.profile),
        body: job.coverLetter,
        attachment,
      }),
    );
    job.status = "draft";
  }
  return targets.length;
}

export async function rewriteLetter(state, store, job) {
  await ensureResumeFile(store, state);
  const attachment = await store.readResume(state.profile.resumeFile);
  job.coverLetter = coverLetter({
    profile: state.profile,
    job,
    hasResume: Boolean(attachment),
  });
  job.draftFile = await store.saveDraft(
    job.id,
    buildEml({
      fromName: state.profile.name,
      fromEmail: state.profile.email,
      to: job.contactEmail || "",
      subject: subjectFor(job, state.profile),
      body: job.coverLetter,
      attachment,
    }),
  );
  if (job.status === "new") job.status = "draft";
  return job;
}

export async function runPass(store, { draft = true, searchImpl = searchJobs } = {}) {
  const state = await store.load();
  if (!state.profile?.rawText) {
    const error = new Error("Add a resume first.");
    error.status = 400;
    throw error;
  }
  const result = await searchImpl(state.profile);
  const merged = mergeJobs(state.jobs, result.jobs);
  state.jobs = merged.jobs;
  const drafted = draft ? await writeDrafts(state, store) : 0;
  state.jobs = sortJobs(state.jobs);
  state.lastRun = {
    at: new Date().toISOString(),
    added: merged.added,
    drafted,
    windowDays: result.windowDays,
    kept: result.jobs.length,
    considered: result.considered,
    errors: result.errors,
    sources: result.sources,
  };
  await store.save(state);
  return state;
}
