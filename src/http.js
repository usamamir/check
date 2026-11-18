import { analyzeResume, parseExtraTerms } from "./analyze.js";
import { prepareJob } from "./search.js";
import { pdfToText } from "./pdf.js";
import { mergeJobs, rewriteLetter, runPass, sortJobs } from "./pipeline.js";
import { buildEml, subjectFor } from "./draft.js";
import { csvField } from "./text.js";
import { workbook } from "./xlsx.js";

const STATUSES = new Set(["new", "saved", "draft", "applied", "skipped"]);

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function json(payload, status = 200, extra = {}) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "private, no-store", ...extra },
  });
}

async function readLimited(request, limit) {
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) fail(413, "That upload is too large.");
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function sheetCsv(state) {
  const header = ["Found", "Title", "Company", "Location", "URL", "Posted", "Match", "Contact", "Email", "Phone", "LinkedIn", "Status", "Summary", "Source"];
  const rows = state.jobs.map((job) => [
    job.firstSeenAt,
    job.title,
    job.company,
    job.location,
    job.url,
    job.postedAt,
    job.matchScore,
    job.contactName,
    job.contactEmail,
    job.contactPhone,
    job.contactLinkedin,
    job.status,
    job.summary,
    job.source,
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvField).join(",")).join("\n")}\n`;
}

function applyProfile(state, text, { sample = false, resumeFile = "" } = {}) {
  const profile = analyzeResume(text, state.profile?.extraTerms || []);
  profile.sample = sample;
  profile.resumeFile = resumeFile;
  state.profile = profile;
}

function parseJson(buffer) {
  if (!buffer.length) return {};
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    fail(400, "Send JSON.");
  }
}

function assertBrowserWrite(request) {
  if (request.headers.get("x-daybook-request") !== "1") {
    fail(403, "Open Daybook and use the buttons on the page.");
  }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") {
    fail(403, "That request came from another site.");
  }
  const origin = request.headers.get("origin");
  if (!origin) return;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    fail(403, "That request came from another site.");
  }
  const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host")]
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  if (hosts.length && !hosts.includes(originHost)) fail(403, "That request came from another site.");
}

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export function passAllowed(state, now = Date.now()) {
  const log = (state.passLog || []).filter((stamp) => now - Date.parse(stamp) < DAY);
  const last = log.length ? Date.parse(log[log.length - 1]) : 0;
  if (last && now - last < MINUTE) {
    return { ok: false, error: "Wait a minute before searching again.", log };
  }
  if (log.length >= 24) {
    return { ok: false, error: "Search limit reached for today. Try again tomorrow.", log };
  }
  return { ok: true, log: [...log, new Date(now).toISOString()] };
}

export async function handleApi(request, store, searchImpl) {
  const url = new URL(request.url);
  const method = request.method;
  if (method === "POST" || method === "PATCH") assertBrowserWrite(request);

  if (method === "GET" && url.pathname === "/api/state") {
    return json(await store.load());
  }
  if (method === "GET" && url.pathname === "/api/sheet.xlsx") {
    return new Response(workbook(await store.load()), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": "attachment; filename=\"daybook-jobs.xlsx\"",
        "cache-control": "private, no-store",
      },
    });
  }
  if (method === "GET" && url.pathname === "/api/sheet.csv") {
    return new Response(sheetCsv(await store.load()), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=\"daybook-sheet.csv\"",
        "cache-control": "private, no-store",
      },
    });
  }
  const draftMatch = url.pathname.match(/^\/api\/drafts\/([a-f0-9]{16})\.eml$/);
  if (method === "GET" && draftMatch) {
    const file = await store.readDraft(draftMatch[1]);
    if (!file) fail(404, "No draft for that role.");
    return new Response(file, {
      headers: {
        "content-type": "message/rfc822",
        "content-disposition": `attachment; filename="${draftMatch[1]}.eml"`,
        "cache-control": "private, no-store",
      },
    });
  }
  if (method === "POST" && url.pathname === "/api/pass") {
    return json(await runPass(store, { searchImpl }));
  }
  if (method === "POST" && url.pathname === "/api/resume") {
    const body = parseJson(await readLimited(request, 1_000_000));
    const text = String(body.text || "").trim();
    if (text.length < 40) fail(400, "Paste more of the resume before analyzing it.");
    const state = await store.load();
    applyProfile(state, text, { resumeFile: await store.saveResume(Buffer.from(text, "utf8"), "txt") });
    await store.save(state);
    return json(state);
  }
  if (method === "POST" && url.pathname === "/api/resume/file") {
    const type = request.headers.get("content-type") || "";
    const body = await readLimited(request, 8_000_000);
    if (!body.length) fail(400, "The upload was empty.");
    const state = await store.load();
    if (type.includes("pdf")) {
      let text = "";
      try {
        text = pdfToText(body);
      } catch {
        fail(400, "Could not read that PDF. Paste the resume instead.");
      }
      if (text.trim().length < 40) fail(400, "Could not read text from that PDF. Paste the resume instead.");
      applyProfile(state, text, { resumeFile: await store.saveResume(body, "pdf") });
    } else {
      const text = body.toString("utf8").trim();
      if (text.length < 40) fail(400, "That text file does not look like a resume.");
      applyProfile(state, text, { resumeFile: await store.saveResume(Buffer.from(text, "utf8"), "txt") });
    }
    await store.save(state);
    return json(state);
  }
  if (method === "POST" && url.pathname === "/api/extra") {
    const body = parseJson(await readLimited(request, 1_000_000));
    const state = await store.load();
    if (!state.profile?.rawText) fail(400, "Add a resume first.");
    const profile = analyzeResume(state.profile.rawText, parseExtraTerms(body.extraTerms));
    profile.sample = Boolean(state.profile.sample);
    profile.resumeFile = state.profile.resumeFile || "";
    state.profile = profile;
    await store.save(state);
    return json(state);
  }
  if (method === "POST" && url.pathname === "/api/jobs") {
    const body = parseJson(await readLimited(request, 1_000_000));
    const title = String(body.title || "").replace(/\s+/g, " ").trim();
    const description = String(body.description || "").trim();
    if (title.length < 2 || description.length < 20) fail(400, "Add a title and the posting text.");
    const jobUrl = String(body.url || "").trim();
    if (jobUrl && !/^https?:\/\//i.test(jobUrl)) fail(400, "Use a full http or https link.");
    const state = await store.load();
    const prepared = prepareJob(
      {
        source: "Pasted",
        title,
        company: String(body.company || "").trim(),
        location: String(body.location || "").trim(),
        url: jobUrl,
        postedAt: new Date().toISOString(),
        description,
      },
      state.profile,
    );
    prepared.relevant = true;
    if (!prepared.company) prepared.company = "Unknown company";
    const merged = mergeJobs(state.jobs, [prepared]);
    state.jobs = merged.jobs;
    const job = state.jobs.find((item) => item.id === prepared.id);
    await rewriteLetter(state, store, job);
    state.jobs = sortJobs(state.jobs);
    await store.save(state);
    return json(state);
  }
  const jobMatch = url.pathname.match(/^\/api\/jobs\/([a-f0-9]{16})$/);
  if (jobMatch && method === "PATCH") {
    const body = parseJson(await readLimited(request, 1_000_000));
    const state = await store.load();
    const job = state.jobs.find((item) => item.id === jobMatch[1]);
    if (!job) fail(404, "That role is not on the sheet.");
    if (body.status !== undefined) {
      if (!STATUSES.has(body.status)) fail(400, "Unknown status.");
      job.status = body.status;
    }
    if (typeof body.coverLetter === "string") {
      job.coverLetter = body.coverLetter.slice(0, 20_000);
      const attachment = await store.readResume(state.profile.resumeFile);
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
    }
    state.jobs = sortJobs(state.jobs);
    await store.save(state);
    return json(state);
  }
  const letterMatch = url.pathname.match(/^\/api\/jobs\/([a-f0-9]{16})\/letter$/);
  if (letterMatch && method === "POST") {
    const state = await store.load();
    const job = state.jobs.find((item) => item.id === letterMatch[1]);
    if (!job) fail(404, "That role is not on the sheet.");
    await rewriteLetter(state, store, job);
    state.jobs = sortJobs(state.jobs);
    await store.save(state);
    return json(state);
  }
  return json({ error: "Not found." }, 404);
}

export async function handleWeb(request, { store, searchImpl } = {}) {
  try {
    return await handleApi(request, store, searchImpl);
  } catch (error) {
    const status = error.status || 500;
    if (status === 500) console.error(error);
    return json({ error: status === 500 ? "Something went wrong." : error.message }, status);
  }
}
