import * as cheerio from "cheerio";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  leads,
  evidence,
  contacts,
  pages,
  products,
  activities,
} from "@/lib/db/schema";
import { getSetting, getScoreWeights, getUserAgent } from "@/lib/db/settings";
import { absoluteUrl, hashText, rootDomain } from "@/lib/utils";
import { fetchJson, fetchPage } from "./fetch";
import {
  detectPlatform,
  detectDropshipSignals,
  summarizeDropshipStatus,
  detectUsLocation,
  extractEmails,
  extractPhones,
  extractOwner,
  extractSocialLinks,
  extractBusinessProfile,
  extractForms,
  scoreLinkRelevance,
  isFreeMail,
} from "@/lib/extractors";
import { computeScore } from "@/lib/scoring/score";
import { resolveMxSafe } from "@/lib/email/mx";
import { fetchDomainAgeYears } from "@/lib/crawler/rdap";
import { maybeLlmEnrich } from "@/lib/llm/enrich";

export type AnalyzeProgress = (msg: string) => void;

function cleanText(html: string): string {
  const $ = cheerio.load(html);
  $("script,style,noscript,svg").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

function collectPriorityLinks(html: string, baseUrl: string, maxPages: number): string[] {
  const $ = cheerio.load(html);
  const scored: Array<{ url: string; score: number }> = [];
  const seen = new Set<string>();
  const origin = new URL(baseUrl).origin;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text() || "";
    try {
      const u = new URL(href, baseUrl);
      if (u.origin !== origin) return;
      u.hash = "";
      const normalized = u.toString();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      const score = scoreLinkRelevance(normalized, text);
      if (score > 0) scored.push({ url: normalized, score });
    } catch {
      // ignore
    }
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(0, maxPages - 1)).map((s) => s.url);
}

async function trySitemapPriority(domain: string, max: number): Promise<string[]> {
  try {
    const res = await fetch(absoluteUrl(domain, "/sitemap.xml"), {
      headers: { "User-Agent": getUserAgent() },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]);
    const scored = locs
      .map((url) => ({ url, score: scoreLinkRelevance(url, url) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max);
    return scored.map((s) => s.url);
  } catch {
    return [];
  }
}

async function shopifyCatalog(domain: string, rate: number) {
  const items: Array<{
    title: string;
    price?: number;
    url?: string;
    image?: string;
    vendor?: string;
    type?: string;
  }> = [];
  let productCount = 0;
  const prices: number[] = [];
  const vendors = new Set<string>();
  const types = new Set<string>();
  let lastUpdated: string | undefined;

  for (let page = 1; page <= 4; page++) {
    const result = await fetchJson<{
      products?: Array<{
        title: string;
        handle: string;
        vendor?: string;
        product_type?: string;
        updated_at?: string;
        images?: Array<{ src: string }>;
        variants?: Array<{ price: string }>;
      }>;
    }>(absoluteUrl(domain, `/products.json?limit=250&page=${page}`), rate);

    if (!result.ok || !result.data?.products?.length) break;
    for (const p of result.data.products) {
      productCount += 1;
      const price = p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : undefined;
      if (price != null && !Number.isNaN(price)) prices.push(price);
      if (p.vendor) vendors.add(p.vendor);
      if (p.product_type) types.add(p.product_type);
      if (p.updated_at) lastUpdated = p.updated_at;
      if (items.length < 12) {
        items.push({
          title: p.title,
          price,
          url: absoluteUrl(domain, `/products/${p.handle}`),
          image: p.images?.[0]?.src,
          vendor: p.vendor,
          type: p.product_type,
        });
      }
    }
    if (result.data.products.length < 250) break;
  }

  prices.sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)] : undefined;
  return {
    items,
    productCount,
    priceMin: prices[0],
    priceMedian: median,
    priceMax: prices[prices.length - 1],
    vendors: [...vendors],
    types: [...types],
    lastUpdated,
  };
}

export async function analyzeDomain(
  domainInput: string,
  opts: {
    leadId?: string;
    searchId?: string;
    niche?: string;
    onProgress?: AnalyzeProgress;
  } = {}
) {
  const db = getDb();
  const domain = rootDomain(domainInput);
  const now = Date.now();
  const rate = parseFloat(getSetting("crawl_rate_per_sec", "1")) || 1;
  const maxPages = parseInt(getSetting("crawl_max_pages", "25"), 10) || 25;
  const log = opts.onProgress ?? (() => undefined);

  let leadId = opts.leadId;
  const existing = db.select().from(leads).where(eq(leads.domain, domain)).get();
  if (existing) {
    leadId = existing.id;
  } else {
    leadId = uuid();
    db.insert(leads)
      .values({
        id: leadId,
        domain,
        niche: opts.niche ?? null,
        searchId: opts.searchId ?? null,
        firstSeenAt: now,
        pipelineStatus: "new",
      })
      .run();
  }

  const addActivity = (type: string, body: string) => {
    db.insert(activities)
      .values({ id: uuid(), leadId: leadId!, type, body, createdAt: Date.now() })
      .run();
  };

  log(`Fetching homepage for ${domain}`);
  const home = await fetchPage(absoluteUrl(domain, "/"), { ratePerSec: rate });

  if (home.error && !home.html) {
    db.update(leads)
      .set({
        crawlError: home.error,
        lastCrawledAt: Date.now(),
        score: home.blocked ? 0 : existing?.score ?? 0,
      })
      .where(eq(leads.id, leadId))
      .run();
    addActivity("crawl_error", home.error);
    return { leadId, domain, error: home.error, blocked: home.blocked };
  }

  if (home.blocked) {
    db.update(leads)
      .set({
        crawlError: home.error || "blocked — manual review",
        lastCrawledAt: Date.now(),
        dropshipStatus: "unknown",
      })
      .where(eq(leads.id, leadId))
      .run();
    addActivity("blocked", "Domain blocked by bot protection — manual review");
  }

  const platform = detectPlatform(home.html, home.headers);
  log(`Platform: ${platform}`);

  const priority = collectPriorityLinks(home.html, home.finalUrl || absoluteUrl(domain, "/"), maxPages);
  const fromSitemap = await trySitemapPriority(domain, 10);
  const toVisit = [...new Set([home.finalUrl || absoluteUrl(domain, "/"), ...priority, ...fromSitemap])].slice(
    0,
    maxPages
  );

  const allEvidence: ReturnType<typeof detectDropshipSignals> = [];
  const allEmails: Array<ReturnType<typeof extractEmails>[number] & { sourceUrl: string }> = [];
  const allPhones: Array<ReturnType<typeof extractPhones>[number] & { sourceUrl: string }> = [];
  const allSocials: ReturnType<typeof extractSocialLinks> = [];
  let location = detectUsLocation("");
  let owner: ReturnType<typeof extractOwner> = null;
  let forms: { contact?: string; application?: string } = {};
  let profile = extractBusinessProfile(home.html, domain);
  let combinedText = "";
  let hasPolicies = false;

  // clear previous evidence/contacts/products for re-crawl
  db.delete(evidence).where(eq(evidence.leadId, leadId)).run();
  db.delete(contacts).where(eq(contacts.leadId, leadId)).run();
  db.delete(products).where(eq(products.leadId, leadId)).run();

  for (const pageUrl of toVisit) {
    log(`Crawling ${pageUrl}`);
    const page =
      pageUrl === (home.finalUrl || absoluteUrl(domain, "/"))
        ? home
        : await fetchPage(pageUrl, { ratePerSec: rate });

    if (!page.html) {
      if (page.error) log(`Skip ${pageUrl}: ${page.error}`);
      continue;
    }

    const text = cleanText(page.html);
    combinedText += `\n${text}`;
    const title = cheerio.load(page.html)("title").first().text().trim();
    db.insert(pages)
      .values({
        id: uuid(),
        leadId,
        url: page.finalUrl || pageUrl,
        title,
        httpStatus: page.status,
        contentHash: hashText(text.slice(0, 5000)),
        cleanedText: text.slice(0, 20000),
        fetchedAt: Date.now(),
      })
      .run();

    if (/policy|terms|shipping|privacy/i.test(pageUrl)) hasPolicies = true;

    const ev = detectDropshipSignals(text);
    for (const e of ev) {
      allEvidence.push(e);
      db.insert(evidence)
        .values({
          id: uuid(),
          leadId,
          type: e.type,
          phrase: e.phrase,
          snippet: e.snippet,
          url: page.finalUrl || pageUrl,
          createdAt: Date.now(),
        })
        .run();
    }

    for (const em of extractEmails(page.html + "\n" + text)) {
      allEmails.push({ ...em, sourceUrl: page.finalUrl || pageUrl });
    }
    for (const ph of extractPhones(text)) {
      allPhones.push({ ...ph, sourceUrl: page.finalUrl || pageUrl });
    }
    for (const s of extractSocialLinks(page.html)) {
      if (!allSocials.find((x) => x.url === s.url)) allSocials.push(s);
    }

    const loc = detectUsLocation(text);
    if (loc.confidence > location.confidence) location = loc;

    if (!owner) {
      const o = extractOwner(page.html, text);
      if (o) owner = { ...o, sourceHint: page.finalUrl || pageUrl };
    }

    const f = extractForms(page.html, page.finalUrl || pageUrl);
    forms = { contact: forms.contact || f.contact, application: forms.application || f.application };

    if (pageUrl === (home.finalUrl || absoluteUrl(domain, "/"))) {
      profile = extractBusinessProfile(page.html, domain);
    }
  }

  // Persist contacts
  const seenEmails = new Set<string>();
  for (const em of allEmails) {
    if (seenEmails.has(em.email)) continue;
    seenEmails.add(em.email);
    const mxValid = await resolveMxSafe(em.email);
    db.insert(contacts)
      .values({
        id: uuid(),
        leadId,
        kind: "email",
        value: em.email,
        label: isFreeMail(em.email) ? `${em.label}|free` : em.label,
        mxValid,
        sourceUrl: em.sourceUrl,
        confidence: em.confidence,
        createdAt: Date.now(),
      })
      .run();
  }

  const seenPhones = new Set<string>();
  for (const ph of allPhones) {
    if (seenPhones.has(ph.e164)) continue;
    seenPhones.add(ph.e164);
    db.insert(contacts)
      .values({
        id: uuid(),
        leadId,
        kind: "phone",
        value: ph.e164,
        label: ph.country,
        sourceUrl: ph.sourceUrl,
        confidence: ph.confidence,
        createdAt: Date.now(),
      })
      .run();
  }

  if (forms.contact) {
    db.insert(contacts)
      .values({
        id: uuid(),
        leadId,
        kind: "form",
        value: forms.contact,
        label: "contact",
        sourceUrl: forms.contact,
        confidence: 0.7,
        createdAt: Date.now(),
      })
      .run();
  }
  if (forms.application) {
    db.insert(contacts)
      .values({
        id: uuid(),
        leadId,
        kind: "application",
        value: forms.application,
        label: "application",
        sourceUrl: forms.application,
        confidence: 0.8,
        createdAt: Date.now(),
      })
      .run();
  }
  for (const s of allSocials) {
    db.insert(contacts)
      .values({
        id: uuid(),
        leadId,
        kind: "social",
        value: s.url,
        label: s.network,
        sourceUrl: s.url,
        confidence: 0.6,
        createdAt: Date.now(),
      })
      .run();
  }
  if (owner) {
    db.insert(contacts)
      .values({
        id: uuid(),
        leadId,
        kind: "owner",
        value: owner.name,
        label: "owner",
        personName: owner.name,
        personRole: owner.role,
        sourceUrl: owner.sourceHint,
        confidence: owner.confidence,
        createdAt: Date.now(),
      })
      .run();
  }

  // Catalog
  let catalog: Awaited<ReturnType<typeof shopifyCatalog>> | null = null;
  if (platform === "shopify") {
    log("Fetching Shopify products.json");
    catalog = await shopifyCatalog(domain, rate);
    for (const p of catalog.items) {
      db.insert(products)
        .values({
          id: uuid(),
          leadId,
          title: p.title,
          price: p.price ?? null,
          url: p.url,
          image: p.image,
          vendor: p.vendor,
          type: p.type,
        })
        .run();
    }
  }

  log("Looking up domain age via RDAP");
  const domainAgeYears = await fetchDomainAgeYears(domain);

  let dropshipStatus = summarizeDropshipStatus(allEvidence);
  let requirements: Record<string, unknown> = {};
  let description = profile.description;

  const llm = await maybeLlmEnrich({
    domain,
    text: combinedText.slice(0, 12000),
    evidence: allEvidence,
  });
  if (llm) {
    dropshipStatus = llm.dropshipStatus || dropshipStatus;
    if (llm.summary) description = llm.summary;
    if (llm.requirements) requirements = llm.requirements;
    if (llm.ownerName && !owner) {
      db.insert(contacts)
        .values({
          id: uuid(),
          leadId,
          kind: "owner",
          value: llm.ownerName,
          label: "owner",
          personName: llm.ownerName,
          personRole: llm.ownerRole || "Founder",
          sourceUrl: "llm",
          confidence: 0.6,
          createdAt: Date.now(),
        })
        .run();
    }
  }

  const roleEmails = allEmails.filter((e) =>
    ["wholesale", "dropship", "partners", "sales", "b2b", "dealer", "trade"].includes(e.label)
  );
  const weights = getScoreWeights();
  const priceBandMin = parseFloat(getSetting("price_band_min", "5")) || 5;
  const priceBandMax = parseFloat(getSetting("price_band_max", "500")) || 500;

  const breakdown = computeScore({
    evidence: allEvidence,
    usConfidence: location.confidence,
    hasRoleEmail: roleEmails.length > 0,
    hasPhone: allPhones.length > 0,
    hasApplicationForm: Boolean(forms.application),
    productCount: catalog?.productCount,
    priceMedian: catalog?.priceMedian,
    priceBandMin,
    priceBandMax,
    nicheMatch: Boolean(opts.niche),
    domainAgeYears,
    hasPolicies,
    recentActivity: Boolean(catalog?.lastUpdated),
    blocked: Boolean(home.blocked),
    weights,
  });

  db.update(leads)
    .set({
      companyName: profile.companyName,
      description,
      platform,
      country: location.confidence >= 0.5 ? "US" : null,
      state: location.state ?? null,
      city: location.city ?? null,
      usConfidence: location.confidence,
      dropshipStatus,
      dropshipScore: breakdown.dropshipEvidence,
      score: breakdown.total,
      tier: breakdown.tier,
      scoreBreakdown: JSON.stringify(breakdown),
      productCount: catalog?.productCount ?? null,
      priceMin: catalog?.priceMin ?? null,
      priceMedian: catalog?.priceMedian ?? null,
      priceMax: catalog?.priceMax ?? null,
      domainAgeYears: domainAgeYears ?? null,
      categories: JSON.stringify(catalog?.types?.length ? catalog.types : profile.categories),
      requirements: JSON.stringify(requirements),
      crawlError: home.blocked ? home.error || "blocked — manual review" : null,
      lastCrawledAt: Date.now(),
      niche: opts.niche ?? existing?.niche ?? null,
      searchId: opts.searchId ?? existing?.searchId ?? null,
    })
    .where(eq(leads.id, leadId))
    .run();

  addActivity("crawled", `Crawled ${toVisit.length} pages. Score ${breakdown.total} (${breakdown.tier}).`);
  log(`Done ${domain}: score ${breakdown.total} tier ${breakdown.tier}`);

  return {
    leadId,
    domain,
    score: breakdown.total,
    tier: breakdown.tier,
    dropshipStatus,
    platform,
  };
}
