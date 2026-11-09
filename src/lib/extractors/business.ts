import * as cheerio from "cheerio";

export type BusinessProfile = {
  companyName?: string;
  description?: string;
  categories: string[];
};

export function extractBusinessProfile(html: string, domain: string): BusinessProfile {
  const $ = cheerio.load(html);
  const ogSite = $('meta[property="og:site_name"]').attr("content");
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const title = $("title").first().text().trim();
  const desc =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  let companyName = ogSite || undefined;
  if (!companyName && title) {
    companyName = title.split(/[|\-–—]/)[0]?.trim();
  }
  if (!companyName && ogTitle) {
    companyName = ogTitle.split(/[|\-–—]/)[0]?.trim();
  }
  if (!companyName) {
    companyName = domain.split(".")[0]?.replace(/-/g, " ");
    if (companyName) {
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    }
  }

  // JSON-LD Organization
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const categories: string[] = [];
  for (const s of scripts) {
    try {
      const data = JSON.parse(s[1]);
      const nodes = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
      for (const node of nodes) {
        if (node?.["@type"] === "Organization" || node?.["@type"] === "Store") {
          if (node.name) companyName = String(node.name);
          if (node.description && !desc) {
            // keep meta desc preferred
          }
          if (node.category) categories.push(String(node.category));
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    companyName,
    description: desc.slice(0, 500) || undefined,
    categories,
  };
}

export function extractForms(html: string, baseUrl: string): { contact?: string; application?: string } {
  const $ = cheerio.load(html);
  let contact: string | undefined;
  let application: string | undefined;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = ($(el).text() || "").toLowerCase();
    const full = (() => {
      try {
        return new URL(href, baseUrl).toString();
      } catch {
        return href;
      }
    })();
    const hay = `${href} ${text}`.toLowerCase();
    if (!application && /(drop\s?ship|wholesale|reseller|dealer|partner|b2b|become.?a|apply)/.test(hay) && /(apply|application|form|sign.?up|register)/.test(hay)) {
      application = full;
    }
    if (!contact && /(contact|get.?in.?touch)/.test(hay)) {
      contact = full;
    }
  });

  return { contact, application };
}

export const PRIORITY_LINK_KEYWORDS = [
  "dropship",
  "drop-ship",
  "drop ship",
  "wholesale",
  "reseller",
  "retailer",
  "partner",
  "dealer",
  "distributor",
  "become-a",
  "become a",
  "apply",
  "b2b",
  "trade",
  "about",
  "our-story",
  "our story",
  "team",
  "contact",
  "faq",
  "shipping",
  "terms",
  "policies",
  "policy",
];

export function scoreLinkRelevance(url: string, linkText: string): number {
  const hay = `${url} ${linkText}`.toLowerCase();
  let score = 0;
  for (const kw of PRIORITY_LINK_KEYWORDS) {
    if (hay.includes(kw)) score += 2;
  }
  if (/(drop\s?ship)/.test(hay)) score += 5;
  if (/wholesale/.test(hay)) score += 3;
  if (/contact|about|team/.test(hay)) score += 2;
  return score;
}
