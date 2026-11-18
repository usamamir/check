import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createServer } from "../src/server.js";
import { prepareJob } from "../src/search.js";
import { analyzeResume, STARTER_TEXT } from "../src/analyze.js";

function write(url, options = {}) {
  const headers = { "x-daybook-request": "1", ...(options.headers || {}) };
  return fetch(url, { ...options, headers });
}

async function withServer(searchImpl, fn) {
  const dir = await mkdtemp(path.join(tmpdir(), "daybook-"));
  const { server } = createServer({ dataDir: dir, searchImpl });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
}

function fakeSearch(profile) {
  const shared = {
    source: "Remote OK",
    title: "Ecommerce Manager",
    postedAt: "2026-11-17T12:00:00Z",
    description: "We are looking for Shopify and Amazon Seller Central experience to own the weekly promo calendar.",
  };
  const jobs = [
    prepareJob({
      ...shared,
      company: "Northwind",
      url: "https://example.com/jobs/northwind",
      description: `${shared.description} Recruiter: Jane Doe recruiter@northwind.test`,
    }, profile),
    prepareJob({
      ...shared,
      company: "Contoso",
      url: "https://example.com/jobs/contoso",
    }, profile),
  ];
  return {
    jobs,
    windowDays: 3,
    considered: 2,
    errors: [],
    sources: [{ name: "Remote OK", count: 2 }],
  };
}

test("a pass writes drafts without inventing an address", async () => {
  await withServer(fakeSearch, async (base) => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Daybook/);
    const blocked = await fetch(`${base}/%2e%2e/package.json`);
    assert.equal(blocked.status, 404);

    const first = await fetch(`${base}/api/state`).then((response) => response.json());
    assert.equal(first.profile.sample, true);
    assert.equal(first.profile.name, "Steph John");

    const passed = await write(`${base}/api/pass`, { method: "POST" }).then((response) => response.json());
    assert.equal(passed.lastRun.added, 2);
    assert.equal(passed.lastRun.drafted, 2);
    const north = passed.jobs.find((job) => job.company === "Northwind");
    const contoso = passed.jobs.find((job) => job.company === "Contoso");
    assert.equal(north.contactEmail, "recruiter@northwind.test");
    assert.equal(contoso.contactEmail, "");
    assert.match(north.coverLetter, /Dear Jane Doe,/);
    assert.match(contoso.coverLetter, /Dear Hiring Team,/);
    assert.doesNotMatch(contoso.coverLetter, /@/);

    const northMail = await fetch(`${base}/api/drafts/${north.id}.eml`).then((response) => response.text());
    const contosoMail = await fetch(`${base}/api/drafts/${contoso.id}.eml`).then((response) => response.text());
    assert.equal(northMail.split(/\r\n/).find((line) => line.startsWith("To:")), "To: recruiter@northwind.test");
    assert.equal(contosoMail.split(/\r\n/).find((line) => line.startsWith("To:")), "To: ");
    assert.match(northMail, /filename="resume.txt"/);
    assert.doesNotMatch(contosoMail, /hr@|careers@/i);

    const again = await write(`${base}/api/pass`, { method: "POST" }).then((response) => response.json());
    assert.equal(again.lastRun.added, 0);
    assert.equal(again.lastRun.drafted, 0);
    assert.equal(again.jobs.find((job) => job.id === north.id).coverLetter, north.coverLetter);

    const csv = await fetch(`${base}/api/sheet.csv`).then((response) => response.text());
    assert.match(csv, /Northwind/);
    assert.match(csv, /Contoso/);
    assert.match(csv, /recruiter@northwind.test/);
    const xlsx = Buffer.from(await fetch(`${base}/api/sheet.xlsx`).then((response) => response.arrayBuffer()));
    assert.equal(xlsx.readUInt32LE(0), 0x04034b50);
    assert.match(xlsx.toString("utf8"), /Northwind/);
    assert.match(xlsx.toString("utf8"), /Job link/);
    assert.match(xlsx.toString("utf8"), /recruiter@northwind.test/);

    const blockedWrite = await fetch(`${base}/api/pass`, { method: "POST" });
    assert.equal(blockedWrite.status, 403);

    const empty = await write(`${base}/api/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "too short" }),
    });
    assert.equal(empty.status, 400);
  });
});

test("pdf upload replaces the starter profile", async () => {
  const sentence = "Steph John has 11 years with Shopify and Amazon Seller Central across ecommerce stores and n8n workflows for the catalog.";
  const data = Buffer.from(`BT (${sentence}) Tj ET`);
  const pdf = Buffer.concat([
    Buffer.from("%PDF-1.4\n"),
    Buffer.from(`<< /Length ${data.length} /Filter /FlateDecode >>\nstream\n`),
    zlib.deflateSync(data),
    Buffer.from("\nendstream\n%%EOF\n"),
  ]);
  await withServer(async () => ({ jobs: [], windowDays: 3, considered: 0, errors: [], sources: [] }), async (base) => {
    const response = await write(`${base}/api/resume/file`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: pdf,
    });
    const state = await response.json();
    assert.equal(response.status, 200);
    assert.equal(state.profile.sample, false);
    assert.equal(state.profile.name, "Steph John");
    assert.equal(state.profile.years, 11);
    assert.equal(state.profile.resumeFile, "resume.pdf");
    assert.ok(state.profile.skills.includes("n8n"));
  });
});

test("pasted posting gets a letter and keeps an edited status", async () => {
  await withServer(async () => ({ jobs: [], windowDays: 3, considered: 0, errors: [], sources: [] }), async (base) => {
    const created = await write(`${base}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Ecommerce Manager",
        company: "Fabrikam",
        url: "https://jobs.example.com/fabrikam",
        description: "We are looking for Shopify experience. No contact address is listed in this posting at all.",
      }),
    }).then((response) => response.json());
    const job = created.jobs.find((item) => item.company === "Fabrikam");
    assert.match(job.coverLetter, /Fabrikam is hiring an Ecommerce Manager/);
    assert.equal(job.contactEmail, "");
    const updated = await write(`${base}/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "skipped", coverLetter: "Edited letter for Fabrikam." }),
    }).then((response) => response.json());
    const saved = updated.jobs.find((item) => item.id === job.id);
    assert.equal(saved.status, "skipped");
    assert.match(saved.coverLetter, /Edited letter/);
    const mail = await fetch(`${base}/api/drafts/${job.id}.eml`).then((response) => response.text());
    assert.match(mail, /Edited letter for Fabrikam/);
    assert.equal(mail.split(/\r\n/).find((line) => line.startsWith("To:")), "To: ");
  });
});

test("analyzer fixture stays free of the starter email", () => {
  assert.equal(analyzeResume(STARTER_TEXT).email, "");
});

test("a search pass cannot be repeated immediately", async () => {
  const { passAllowed } = await import("../src/http.js");
  const now = Date.parse("2026-11-18T12:00:00Z");
  const first = passAllowed({ passLog: [] }, now);
  assert.equal(first.ok, true);
  const second = passAllowed({ passLog: first.log }, now + 10_000);
  assert.equal(second.ok, false);
  const later = passAllowed({ passLog: first.log }, now + 70_000);
  assert.equal(later.ok, true);
});
