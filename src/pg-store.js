import { starterState } from "./store.js";
import { sql } from "./db.js";

function ownerOf(owner) {
  if (typeof owner !== "string" || owner.length < 3 || owner.length > 220 || /[\0\r\n]/.test(owner)) {
    const error = new Error("Missing viewer.");
    error.status = 401;
    throw error;
  }
  return owner;
}

function asState(value) {
  const state = typeof value === "string" ? JSON.parse(value) : value;
  if (!state?.profile) return starterState();
  state.jobs ||= [];
  state.lastRun ||= null;
  return state;
}

export function openPgStore(ownerKey) {
  const owner = ownerOf(ownerKey);
  return {
    async load() {
      const rows = await sql("select state from daybook_state where owner = $1", [owner]);
      if (!rows.length) return starterState();
      return asState(rows[0].state);
    },
    async save(state) {
      const clean = {
        profile: state.profile,
        jobs: state.jobs,
        lastRun: state.lastRun,
        passLog: state.passLog || [],
      };
      await sql(
        `insert into daybook_state (owner, state)
         values ($1, $2::jsonb)
         on conflict (owner) do update set state = excluded.state, updated_at = now()`,
        [owner, JSON.stringify(clean)],
      );
    },
    async saveResume(buffer, extension) {
      const filename = extension === "pdf" ? "resume.pdf" : "resume.txt";
      const contentType = filename.endsWith("pdf") ? "application/pdf" : "text/plain";
      await sql(
        `insert into daybook_state (owner, state, resume, resume_filename, resume_type)
         values ($1, $2::jsonb, $3, $4, $5)
         on conflict (owner) do update
           set resume = excluded.resume,
               resume_filename = excluded.resume_filename,
               resume_type = excluded.resume_type,
               updated_at = now()`,
        [owner, JSON.stringify(starterState()), buffer, filename, contentType],
      );
      return filename;
    },
    async readResume(filename) {
      const base = pathBasename(filename);
      if (!/^resume\.(pdf|txt)$/.test(base)) return null;
      const rows = await sql(
        "select resume, resume_filename, resume_type from daybook_state where owner = $1 and resume_filename = $2",
        [owner, base],
      );
      if (!rows.length || rows[0].resume == null) return null;
      const content = Buffer.isBuffer(rows[0].resume) ? rows[0].resume : Buffer.from(rows[0].resume);
      return { filename: base, content, contentType: rows[0].resume_type || "application/octet-stream" };
    },
    async saveDraft(id, eml) {
      if (!/^[a-f0-9]{16}$/.test(id)) throw new Error("Bad draft id.");
      await sql(
        `insert into daybook_drafts (owner, id, eml) values ($1, $2, $3)
         on conflict (owner, id) do update set eml = excluded.eml`,
        [owner, id, String(eml)],
      );
      return `${id}.eml`;
    },
    async readDraft(id) {
      if (!/^[a-f0-9]{16}$/.test(id)) return null;
      const rows = await sql("select eml from daybook_drafts where owner = $1 and id = $2", [owner, id]);
      if (!rows.length) return null;
      return Buffer.from(String(rows[0].eml), "utf8");
    },
  };
}

function pathBasename(filename) {
  return String(filename || "").split(/[/\\]/).pop();
}
