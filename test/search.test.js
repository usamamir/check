import test from "node:test";
import assert from "node:assert/strict";
import { analyzeResume, STARTER_TEXT } from "../src/analyze.js";
import { extractContact, searchJobs, selectJobs } from "../src/search.js";

const now = Date.parse("2026-11-18T12:00:00Z");
const profile = analyzeResume(STARTER_TEXT);

function listing(title, daysAgo, extra = {}) {
  return {
    source: "Remote OK",
    title,
    company: extra.company || "Northwind",
    url: extra.url || `https://example.com/jobs/${encodeURIComponent(title)}-${daysAgo}`,
    postedAt: extra.postedAt === undefined ? new Date(now - daysAgo * 86400000).toISOString() : extra.postedAt,
    description: extra.description || "We are looking for Shopify and Amazon Seller Central experience to own the store.",
  };
}

test("keeps a 3-day window when there are enough matches", () => {
  const recent = [0, 1, 1, 2, 2].map((days, index) => listing("Ecommerce Manager", days, { url: `https://example.com/jobs/recent-${index}` }));
  const old = listing("Ecommerce Manager", 10, { url: "https://example.com/jobs/old" });
  const selected = selectJobs([...recent, old], profile, { now, minimum: 5 });
  assert.equal(selected.windowDays, 3);
  assert.equal(selected.jobs.length, 5);
  assert.ok(selected.jobs.every((job) => !job.url.endsWith("/old")));
});

test("widens to 14 days when the recent window is thin", () => {
  const selected = selectJobs(
    [listing("Ecommerce Manager", 1, { url: "https://example.com/jobs/new" }), listing("Shopify Manager", 10, { url: "https://example.com/jobs/older" }), listing("Ecommerce Manager", 20, { url: "https://example.com/jobs/ancient" })],
    profile,
    { now, minimum: 5 },
  );
  assert.equal(selected.windowDays, 14);
  assert.deepEqual(selected.jobs.map((job) => job.url).sort(), [
    "https://example.com/jobs/new",
    "https://example.com/jobs/older",
  ]);
});

test("hyphenated commerce titles count, analyst titles do not", () => {
  const selected = selectJobs(
    [
      listing("E-Commerce Manager", 1, { url: "https://example.com/jobs/hyphen" }),
      listing("Senior Data Analyst - Application Mobile E-commerce", 1, { url: "https://example.com/jobs/analyst" }),
    ],
    profile,
    { now, minimum: 5 },
  );
  assert.deepEqual(selected.jobs.map((job) => job.url), ["https://example.com/jobs/hyphen"]);
});

test("a skill mention in an unrelated title is not a match", () => {
  const selected = selectJobs(
    [
      listing("Senior Security Platform Engineer", 1, {
        url: "https://example.com/jobs/security",
        description: "The platform uses Shopify as one vendor among many internal tools.",
      }),
      listing("Head of Ecommerce", 1, {
        url: "https://example.com/jobs/head",
        description: "Lead the commercial team and the weekly trading calendar.",
      }),
    ],
    profile,
    { now, minimum: 5 },
  );
  assert.deepEqual(selected.jobs.map((job) => job.url), ["https://example.com/jobs/head"]);
});

test("drops unrelated roles and undated roles", () => {
  const selected = selectJobs(
    [
      listing("Registered Nurse", 0, { description: "Patient care on the night shift for a hospital ward team." }),
      listing("Ecommerce Manager", 0, { postedAt: "", url: "https://example.com/jobs/undated" }),
      listing("Ecommerce Manager", 0, { url: "https://example.com/jobs/same" }),
      listing("Ecommerce Manager", 0, { url: "https://example.com/jobs/same" }),
    ],
    profile,
    { now, minimum: 5 },
  );
  assert.deepEqual(selected.jobs.map((job) => job.url), ["https://example.com/jobs/same"]);
});

test("contact comes only from the posting", () => {
  const found = extractContact("Recruiter: Jane Doe. Write recruiter@northwind.test or noreply@northwind.test.", "steph.john@mailbox.test");
  assert.equal(found.contactName, "Jane Doe");
  assert.equal(found.contactEmail, "recruiter@northwind.test");
  const none = extractContact("Contact the Hiring Manager. Email steph.john@mailbox.test and noreply@northwind.test.", "steph.john@mailbox.test");
  assert.equal(none.contactName, "");
  assert.equal(none.contactEmail, "");
});

test("feed requests carry skills, not the person's name or email", async () => {
  const person = analyzeResume(`${STARTER_TEXT}\nsteph.john@mailbox.test\n`);
  const urls = [];
  const result = await searchJobs(person, {
    now,
    fetchImpl: async (url) => {
      const href = String(url);
      urls.push(href);
      if (href.includes("arbeitnow")) throw new Error("arbeitnow.com returned 503");
      if (href.includes("remoteok")) {
        return {
          ok: true,
          json: async () => [
            { legal: true },
            {
              position: "Ecommerce Manager",
              company: "Northwind",
              date: "2026-11-17T12:00:00Z",
              url: "https://remoteok.com/remote-jobs/northwind",
              description: "<p>We are looking for Shopify experience.</p> Recruiter: Jane Doe recruiter@northwind.test",
              tags: ["shopify"],
            },
          ],
        };
      }
      return { ok: true, json: async () => ({ jobs: [], data: [] }) };
    },
  });
  assert.ok(urls.some((url) => /shopify/i.test(url)));
  assert.ok(urls.every((url) => !/steph|mailbox|@/i.test(url)));
  assert.equal(result.jobs.length, 1);
  assert.equal(result.jobs[0].company, "Northwind");
  assert.equal(result.jobs[0].contactEmail, "recruiter@northwind.test");
  assert.equal(result.jobs[0].contactName, "Jane Doe");
  assert.match(result.errors.join(" "), /503/);
});
