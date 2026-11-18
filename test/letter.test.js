import test from "node:test";
import assert from "node:assert/strict";
import { analyzeResume, STARTER_TEXT } from "../src/analyze.js";
import { coverLetter } from "../src/letter.js";
import { buildEml } from "../src/draft.js";
import { prepareJob } from "../src/search.js";

const profile = analyzeResume(STARTER_TEXT);

test("letter stays inside the resume and names the role", () => {
  const job = prepareJob(
    {
      source: "Pasted",
      title: "Ecommerce Manager",
      company: "Northwind",
      url: "https://example.com/jobs/northwind",
      postedAt: "2026-11-17T00:00:00Z",
      description: "We are looking for someone to own Shopify and Amazon Seller Central. Email recruiter@northwind.test.",
    },
    profile,
  );
  job.contactName = "Jane Doe";
  const letter = coverLetter({ profile, job, hasResume: true });
  assert.match(letter, /Dear Jane Doe,/);
  assert.match(letter, /Northwind is hiring an Ecommerce Manager/);
  assert.match(letter, /I have 11 years in this field, using Shopify and Amazon Seller Central\./);
  assert.match(letter, /My resume is attached/);
  assert.doesNotMatch(letter, /recruiter@northwind.test/);
  assert.doesNotMatch(letter, /Klaviyo|excited to apply|I am thrilled|\d%/i);
});

test("missing company and missing resume file stay honest", () => {
  const letter = coverLetter({
    profile,
    job: { company: "Unknown company", title: "Shopify Manager", description: "A short note.", matchedTerms: ["Shopify"], contactName: "" },
    hasResume: false,
  });
  assert.match(letter, /This posting is for a Shopify Manager/);
  assert.match(letter, /send the resume/);
  assert.match(letter, /Dear Hiring Team,/);
});

test("draft leaves To blank when the posting has no address", () => {
  const eml = buildEml({
    fromName: "Steph John",
    fromEmail: "",
    to: "",
    subject: "Application: Ecommerce Manager - Steph John",
    body: "Hello\n",
    attachment: { filename: "resume.txt", contentType: "text/plain", content: Buffer.from("resume") },
  });
  assert.equal(eml.split(/\r\n/).find((line) => line.startsWith("To:")), "To: ");
  assert.match(eml, /Subject: Application: Ecommerce Manager - Steph John/);
  assert.match(eml, /filename="resume.txt"/);
  assert.match(eml, /X-Unsent: 1/);
  assert.doesNotMatch(eml, /hr@|careers@/i);
});
