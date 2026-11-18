import test from "node:test";
import assert from "node:assert/strict";
import { openPgStore } from "../src/pg-store.js";

test("postgres store keeps one viewer's sheet apart from another's", async (t) => {
  if (process.env.DATABASE_URL) {
    t.skip("DATABASE_URL is set; this test uses the local database only");
    return;
  }
  const alpha = openPgStore("production:user:alpha");
  const beta = openPgStore("preview:user:alpha");
  const first = await alpha.load();
  assert.equal(first.profile.sample, true);
  first.profile.name = "Alpha";
  first.profile.sample = false;
  await alpha.save(first);
  await alpha.saveResume(Buffer.from("alpha resume text that is long enough"), "txt");
  await alpha.saveDraft("abcabcabcabcabca", "To: alpha@mailbox.test\r\n\r\nHello\r\n");

  const saved = await alpha.load();
  assert.equal(saved.profile.name, "Alpha");
  const resume = await alpha.readResume("resume.txt");
  assert.match(resume.content.toString("utf8"), /alpha resume/);
  const draft = await alpha.readDraft("abcabcabcabcabca");
  assert.match(draft.toString("utf8"), /alpha@mailbox.test/);

  const other = await beta.load();
  assert.equal(other.profile.sample, true);
  assert.equal(await beta.readDraft("abcabcabcabcabca"), null);
});
