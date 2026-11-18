import test from "node:test";
import assert from "node:assert/strict";
import { STARTER_TEXT, analyzeResume } from "../src/analyze.js";

test("starter brief becomes a tight search string", () => {
  const profile = analyzeResume(STARTER_TEXT);
  assert.equal(profile.name, "Steph John");
  assert.equal(profile.years, 11);
  assert.equal(profile.email, "");
  assert.ok(profile.skills.includes("Shopify"));
  assert.ok(profile.skills.includes("Amazon Seller Central"));
  assert.ok(profile.skills.includes("n8n"));
  assert.ok(profile.searchTitles.includes("Ecommerce Manager"));
  assert.ok(profile.searchTitles.includes("Amazon Account Manager"));
  assert.match(profile.query, /Shopify/);
  assert.match(profile.query, /n8n/);
  assert.match(profile.query, /Ecommerce Manager/);
  assert.doesNotMatch(profile.query, /@/);
});

test("explicit years win over a longer date span", () => {
  const profile = analyzeResume("Maya Chen\nmaya.chen@mailbox.test\n415-555-0199\n8 years in product design, 2010 to 2026.\nTarget roles: Design Manager\n");
  assert.equal(profile.name, "Maya Chen");
  assert.equal(profile.email, "maya.chen@mailbox.test");
  assert.equal(profile.phone, "415-555-0199");
  assert.equal(profile.years, 8);
  assert.ok(profile.searchTitles.some((title) => /Design Manager/i.test(title)));
});

test("extra words are added to the search string and capped", () => {
  const profile = analyzeResume(STARTER_TEXT, "retention, klaviyo, x");
  assert.deepEqual(profile.extraTerms, ["retention", "klaviyo"]);
  assert.match(profile.query, /retention/);
  assert.match(profile.query, /klaviyo/);
});
