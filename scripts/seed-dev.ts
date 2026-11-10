/**
 * Dev-only seed — does NOT run in production views automatically.
 * Usage: npx tsx scripts/seed-dev.ts
 */
import { v4 as uuid } from "uuid";
import { getDb } from "../src/lib/db";
import { leads, evidence, contacts, activities } from "../src/lib/db/schema";

const db = getDb();
const now = Date.now();
const id = uuid();

db.insert(leads)
  .values({
    id,
    domain: "example-us-supplier.test",
    companyName: "Example US Supplier",
    description: "Dev seed lead — not a real company.",
    niche: "pet supplies",
    platform: "shopify",
    country: "US",
    state: "CA",
    city: "Los Angeles",
    usConfidence: 0.9,
    dropshipStatus: "likely",
    score: 72,
    tier: "B",
    scoreBreakdown: JSON.stringify({
      dropshipEvidence: 24,
      usConfidence: 13.5,
      contactability: 12,
      catalogFit: 10,
      legitimacy: 8,
      penalties: 0,
      total: 72,
      tier: "B",
    }),
    productCount: 48,
    priceMin: 12,
    priceMedian: 34,
    priceMax: 89,
    pipelineStatus: "new",
    firstSeenAt: now,
    lastCrawledAt: now,
  })
  .run();

db.insert(evidence)
  .values({
    id: uuid(),
    leadId: id,
    type: "positive",
    phrase: "dropship program",
    snippet: "Join our dropship program for retailers",
    url: "https://example-us-supplier.test/pages/dropship",
    createdAt: now,
  })
  .run();

db.insert(contacts)
  .values({
    id: uuid(),
    leadId: id,
    kind: "email",
    value: "wholesale@example-us-supplier.test",
    label: "wholesale",
    mxValid: false,
    sourceUrl: "https://example-us-supplier.test/pages/contact",
    confidence: 1,
    createdAt: now,
  })
  .run();

db.insert(activities)
  .values({
    id: uuid(),
    leadId: id,
    type: "seed",
    body: "Created by scripts/seed-dev.ts",
    createdAt: now,
  })
  .run();

console.log("Seeded lead", id, "example-us-supplier.test");
