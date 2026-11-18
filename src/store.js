import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { analyzeResume, STARTER_TEXT } from "./analyze.js";

export function starterState() {
  const profile = analyzeResume(STARTER_TEXT);
  profile.sample = true;
  return { profile, jobs: [], lastRun: null };
}

export function openStore(dataDir) {
  const dir = dataDir;
  const draftsDir = path.join(dir, "drafts");
  const statePath = path.join(dir, "state.json");
  mkdirSync(draftsDir, { recursive: true });

  function load() {
    if (!existsSync(statePath)) return starterState();
    const parsed = JSON.parse(readFileSync(statePath, "utf8"));
    if (!parsed.profile) return starterState();
    parsed.jobs ||= [];
    parsed.lastRun ||= null;
    return parsed;
  }

  function save(state) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  }

  function saveResume(buffer, extension) {
    const ext = extension === "pdf" ? "pdf" : "txt";
    const filename = `resume.${ext}`;
    writeFileSync(path.join(dir, filename), buffer);
    return filename;
  }

  function readResume(filename) {
    const base = path.basename(String(filename || ""));
    if (!/^resume\.(pdf|txt)$/.test(base)) return null;
    const full = path.join(dir, base);
    if (!existsSync(full)) return null;
    return {
      filename: base,
      content: readFileSync(full),
      contentType: base.endsWith(".pdf") ? "application/pdf" : "text/plain",
    };
  }

  function saveDraft(id, eml) {
    if (!/^[a-f0-9]{16}$/.test(id)) throw new Error("Bad draft id.");
    const filename = `${id}.eml`;
    writeFileSync(path.join(draftsDir, filename), eml);
    return filename;
  }

  function readDraft(id) {
    if (!/^[a-f0-9]{16}$/.test(id)) return null;
    const full = path.join(draftsDir, `${id}.eml`);
    if (!existsSync(full)) return null;
    return readFileSync(full);
  }

  return { dir, load, save, saveResume, readResume, saveDraft, readDraft };
}
