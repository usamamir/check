import { createServer as createHttpServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeResume, parseExtraTerms } from "./analyze.js";
import { prepareJob } from "./search.js";
import { pdfToText } from "./pdf.js";
import { openStore } from "./store.js";
import { mergeJobs, rewriteLetter, runPass, sortJobs } from "./pipeline.js";
import { buildEml, subjectFor } from "./draft.js";
import { csvField } from "./text.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(root, "public");
const STATUSES = new Set(["new", "saved", "draft", "applied", "skipped"]);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("That upload is too large."), { status: 413 }));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJson(req) {
  const body = await readBody(req, 1_000_000);
  if (!body.length) return {};
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    fail(400, "Send JSON.");
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Cache-Control": "no-store", ...headers });
  res.end(body);
}

function sendJson(res, payload, status = 200) {
  send(res, status, JSON.stringify(payload), { "Content-Type": "application/json; charset=utf-8" });
}

function sheetCsv(state) {
  const header = [
    "Found",
    "Title",
    "Company",
    "Location",
    "URL",
    "Posted",
    "Match",
    "Contact",
    "Email",
    "Status",
    "Summary",
    "Source",
  ];
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
    job.status,
    job.summary,
    job.source,
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvField).join(",")).join("\n")}\n`;
}

function publicPath(urlPath) {
  let requested = "index.html";
  if (urlPath !== "/") {
    try {
      requested = decodeURIComponent(urlPath).replace(/^\/+/, "");
    } catch {
      return null;
    }
  }
  if (!requested || requested.includes("\0")) return null;
  const full = path.resolve(PUBLIC_DIR, requested);
  if (full !== PUBLIC_DIR && !full.startsWith(`${PUBLIC_DIR}${path.sep}`)) return null;
  return full;
}

function applyProfile(state, text, { sample = false, resumeFile = "" } = {}) {
  const profile = analyzeResume(text, state.profile?.extraTerms || []);
  profile.sample = sample;
  profile.resumeFile = resumeFile;
  state.profile = profile;
}

export function createServer({ dataDir = path.join(root, "data"), searchImpl } = {}) {
  const store = openStore(dataDir);

  async function handle(req, res) {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/api/state") {
      sendJson(res, store.load());
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/sheet.csv") {
      send(res, 200, sheetCsv(store.load()), {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"daybook-sheet.csv\"",
      });
      return;
    }
    const draftMatch = url.pathname.match(/^\/api\/drafts\/([a-f0-9]{16})\.eml$/);
    if (req.method === "GET" && draftMatch) {
      const file = store.readDraft(draftMatch[1]);
      if (!file) fail(404, "No draft for that role.");
      send(res, 200, file, {
        "Content-Type": "message/rfc822",
        "Content-Disposition": `attachment; filename="${draftMatch[1]}.eml"`,
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/pass") {
      sendJson(res, await runPass(store, { searchImpl }));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/resume") {
      const body = await readJson(req);
      const text = String(body.text || "").trim();
      if (text.length < 40) fail(400, "Paste more of the resume before analyzing it.");
      const state = store.load();
      applyProfile(state, text, { resumeFile: store.saveResume(Buffer.from(text, "utf8"), "txt") });
      store.save(state);
      sendJson(res, state);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/resume/file") {
      const type = String(req.headers["content-type"] || "");
      const body = await readBody(req, 8_000_000);
      if (!body.length) fail(400, "The upload was empty.");
      const state = store.load();
      if (type.includes("pdf")) {
        let text = "";
        try {
          text = pdfToText(body);
        } catch {
          fail(400, "Could not read that PDF. Paste the resume instead.");
        }
        if (text.trim().length < 40) fail(400, "Could not read text from that PDF. Paste the resume instead.");
        applyProfile(state, text, { resumeFile: store.saveResume(body, "pdf") });
      } else {
        const text = body.toString("utf8").trim();
        if (text.length < 40) fail(400, "That text file does not look like a resume.");
        applyProfile(state, text, { resumeFile: store.saveResume(Buffer.from(text, "utf8"), "txt") });
      }
      store.save(state);
      sendJson(res, state);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/extra") {
      const body = await readJson(req);
      const state = store.load();
      if (!state.profile?.rawText) fail(400, "Add a resume first.");
      const extra = parseExtraTerms(body.extraTerms);
      const profile = analyzeResume(state.profile.rawText, extra);
      profile.sample = Boolean(state.profile.sample);
      profile.resumeFile = state.profile.resumeFile || "";
      state.profile = profile;
      store.save(state);
      sendJson(res, state);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/jobs") {
      const body = await readJson(req);
      const title = String(body.title || "").replace(/\s+/g, " ").trim();
      const description = String(body.description || "").trim();
      if (title.length < 2 || description.length < 20) fail(400, "Add a title and the posting text.");
      let jobUrl = String(body.url || "").trim();
      if (jobUrl && !/^https?:\/\//i.test(jobUrl)) fail(400, "Use a full http or https link.");
      const state = store.load();
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
      rewriteLetter(state, store, job);
      state.jobs = sortJobs(state.jobs);
      store.save(state);
      sendJson(res, state);
      return;
    }
    const jobMatch = url.pathname.match(/^\/api\/jobs\/([a-f0-9]{16})$/);
    if (jobMatch && req.method === "PATCH") {
      const body = await readJson(req);
      const state = store.load();
      const job = state.jobs.find((item) => item.id === jobMatch[1]);
      if (!job) fail(404, "That role is not on the sheet.");
      if (body.status !== undefined) {
        if (!STATUSES.has(body.status)) fail(400, "Unknown status.");
        job.status = body.status;
      }
      if (typeof body.coverLetter === "string") {
        job.coverLetter = body.coverLetter.slice(0, 20_000);
        const attachment = store.readResume(state.profile.resumeFile);
        job.draftFile = store.saveDraft(
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
      store.save(state);
      sendJson(res, state);
      return;
    }
    const letterMatch = url.pathname.match(/^\/api\/jobs\/([a-f0-9]{16})\/letter$/);
    if (letterMatch && req.method === "POST") {
      const state = store.load();
      const job = state.jobs.find((item) => item.id === letterMatch[1]);
      if (!job) fail(404, "That role is not on the sheet.");
      rewriteLetter(state, store, job);
      state.jobs = sortJobs(state.jobs);
      store.save(state);
      sendJson(res, state);
      return;
    }
    if (req.method === "GET") {
      const file = publicPath(url.pathname);
      let stat;
      try {
        stat = statSync(file || "");
      } catch {
        fail(404, "Not found.");
      }
      if (!stat?.isFile()) fail(404, "Not found.");
      const ext = path.extname(file);
      if (!TYPES[ext]) fail(404, "Not found.");
      send(res, 200, readFileSync(file), { "Content-Type": TYPES[ext] });
      return;
    }
    fail(404, "Not found.");
  }

  const server = createHttpServer((req, res) => {
    handle(req, res).catch((error) => {
      const status = error.status || 500;
      if (status === 500) console.error(error);
      if (!res.headersSent) {
        sendJson(res, { error: status === 500 ? "Something went wrong." : error.message }, status);
      }
    });
  });
  return { server, store };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || "127.0.0.1";
  const { server } = createServer();
  server.listen(port, host, () => {
    console.log(`Daybook is at http://${host}:${port}`);
  });
}
