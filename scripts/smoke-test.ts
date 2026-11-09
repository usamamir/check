/**
 * Smoke test: run the full crawl/analyze pipeline on real domains.
 * Usage: npx tsx scripts/smoke-test.ts domain1.com domain2.com ...
 */
import { analyzeDomain } from "../src/lib/crawler/analyze";
import { closeBrowser } from "../src/lib/crawler/fetch";
import { getDb } from "../src/lib/db";
import { eq } from "drizzle-orm";
import { leads, evidence, contacts, products } from "../src/lib/db/schema";

async function main() {
  const domains = process.argv.slice(2);
  if (!domains.length) {
    console.error("Usage: npx tsx scripts/smoke-test.ts domain1.com domain2.com ...");
    process.exit(1);
  }

  // ensure DB boots
  getDb();

  for (const domain of domains) {
    console.log("\n==============================");
    console.log(`Analyzing ${domain}`);
    console.log("==============================");
    try {
      const result = await analyzeDomain(domain, {
        niche: "smoke-test",
        onProgress: (m) => console.log("  ·", m),
      });
      const db = getDb();
      const lead = db.select().from(leads).where(eq(leads.id, result.leadId)).get();
      const ev = db.select().from(evidence).where(eq(evidence.leadId, result.leadId)).all();
      const cs = db.select().from(contacts).where(eq(contacts.leadId, result.leadId)).all();
      const ps = db.select().from(products).where(eq(products.leadId, result.leadId)).all();

      console.log(
        JSON.stringify(
          {
            domain: lead?.domain,
            companyName: lead?.companyName,
            platform: lead?.platform,
            dropshipStatus: lead?.dropshipStatus,
            score: lead?.score,
            tier: lead?.tier,
            state: lead?.state,
            productCount: lead?.productCount,
            evidenceCount: ev.length,
            contacts: cs.map((c) => ({ kind: c.kind, value: c.value, label: c.label, sourceUrl: c.sourceUrl })),
            sampleProducts: ps.slice(0, 3).map((p) => ({ title: p.title, price: p.price })),
            crawlError: lead?.crawlError,
          },
          null,
          2
        )
      );
    } catch (err) {
      console.error(`FAILED ${domain}:`, err);
    }
  }

  await closeBrowser();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
