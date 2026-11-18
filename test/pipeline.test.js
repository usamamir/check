import test from "node:test";
import assert from "node:assert/strict";
import { mergeJobs } from "../src/pipeline.js";

test("a second pass does not wipe a letter or a status", () => {
  const existing = [{
    id: "abcabcabcabcabca",
    status: "applied",
    coverLetter: "Keep me",
    title: "Old title",
    matchScore: 10,
    description: "Old",
  }];
  const incoming = [{
    id: "abcabcabcabcabca",
    status: "new",
    coverLetter: "",
    title: "Ecommerce Manager",
    company: "Northwind",
    description: "We are looking for Shopify experience on the store team.",
    matchScore: 80,
    matchedTerms: ["Shopify"],
    contactEmail: "",
    contactName: "",
  }];
  const merged = mergeJobs(existing, incoming);
  assert.equal(merged.added, 0);
  assert.equal(merged.jobs[0].status, "applied");
  assert.equal(merged.jobs[0].coverLetter, "Keep me");
  assert.equal(merged.jobs[0].title, "Ecommerce Manager");
  assert.equal(merged.jobs[0].matchScore, 80);
  assert.match(merged.jobs[0].summary, /Shopify/);
});
