import { hasPhrase, normalize } from "./text.js";

export const STARTER_TEXT = `Steph John
E-commerce operator

11 years of e-commerce experience across Shopify stores and Amazon Seller Central.
Builds n8n workflows for catalog updates, order exceptions, and reporting.
Work covers marketplace listings, paid traffic handoff, and the day-to-day of keeping a store in stock and converting.

Target roles: Ecommerce Manager, Amazon Account Manager, Shopify Manager, Marketplace Manager.
`;

const SKILL_BOOK = [
  ["Shopify", ["shopify plus", "shopify"]],
  ["Amazon Seller Central", ["amazon seller central", "seller central", "amazon fba", "amazon ppc"]],
  ["n8n", ["n8n"]],
  ["Klaviyo", ["klaviyo"]],
  ["Gorgias", ["gorgias"]],
  ["Recharge", ["recharge"]],
  ["Google Ads", ["google ads", "adwords"]],
  ["Meta Ads", ["meta ads", "facebook ads"]],
  ["GA4", ["google analytics", "ga4"]],
  ["HubSpot", ["hubspot"]],
  ["Salesforce", ["salesforce"]],
  ["Zapier", ["zapier"]],
  ["SEO", ["search engine optimization", "seo"]],
  ["Email marketing", ["email marketing", "lifecycle marketing"]],
  ["Conversion", ["conversion rate optimization", "cro"]],
  ["Paid media", ["paid media", "performance marketing"]],
  ["Merchandising", ["merchandising"]],
  ["Inventory", ["inventory planning", "inventory"]],
  ["Supply chain", ["supply chain", "3pl"]],
  ["SQL", ["sql"]],
  ["Python", ["python"]],
  ["JavaScript", ["javascript"]],
];

const DISTINCTIVE = new Set([
  "Shopify",
  "Amazon Seller Central",
  "n8n",
  "Klaviyo",
  "Gorgias",
  "Recharge",
  "Google Ads",
  "Meta Ads",
  "HubSpot",
  "Salesforce",
]);

const GENERIC = new Set([
  "SEO",
  "Email marketing",
  "Conversion",
  "Paid media",
  "Merchandising",
  "Inventory",
  "Catalog",
  "Supply chain",
  "SQL",
  "Python",
  "JavaScript",
  "GA4",
  "Zapier",
]);

const ROLE_WORD = /\b(manager|director|lead|head|specialist|coordinator|owner|consultant|developer|engineer|operator|strategist|analyst|buyer|planner)\b/i;
const SKIP_LINE = /^(resume|cv|curriculum vitae|profile|summary|experience|skills|work history|education|references)$/i;

export function skillWeight(name, where) {
  if (DISTINCTIVE.has(name) && where === "title") return 28;
  if (DISTINCTIVE.has(name)) return 18;
  if (where === "title") return 14;
  if (GENERIC.has(name)) return 8;
  return 12;
}

export function isDistinctive(name) {
  return DISTINCTIVE.has(name);
}

function firstIndex(text, phrase) {
  const hay = normalize(text);
  const pin = normalize(phrase);
  const at = hay.indexOf(pin);
  return at;
}

export function detectSkills(text) {
  const found = [];
  for (const [name, phrases] of SKILL_BOOK) {
    let at = -1;
    for (const phrase of phrases) {
      if (!hasPhrase(text, phrase)) continue;
      const index = firstIndex(text, phrase);
      if (index >= 0 && (at < 0 || index < at)) at = index;
    }
    if (at >= 0) found.push({ name, at });
  }
  found.sort((a, b) => a.at - b.at);
  return found.map((item) => item.name);
}

function cleanTitle(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\-*•\d.)\s]+/, "")
    .replace(/[|–—].*$/, "")
    .trim();
}

export function detectTitles(text) {
  const titles = [];
  const push = (value) => {
    const title = cleanTitle(value).replace(/\.$/, "");
    if (!title || title.length > 70 || title.length < 4) return;
    if (!ROLE_WORD.test(title)) return;
    if (/https?:|@|\d{3}/.test(title)) return;
    const key = normalize(title);
    if (!key || titles.some((item) => normalize(item) === key)) return;
    titles.push(title.replace(/\be-commerce\b/i, "Ecommerce").replace(/\bE-commerce\b/, "Ecommerce"));
  };

  for (const rawLine of String(text || "").split(/\n/)) {
    const line = rawLine.trim();
    if (!line || SKIP_LINE.test(line)) continue;
    const labeled = line.match(/^(?:target roles?|seeking|objective)\s*:\s*(.+)$/i);
    if (labeled) {
      for (const part of labeled[1].split(/,|\/|\band\b/)) push(part);
      continue;
    }
    if (line.length <= 70 && !/[.!?].+[.!?]|[.!?]\s+\w/.test(line)) push(line);
  }
  return titles;
}

export function searchTitlesFrom(titles) {
  const strong = titles.filter((title) => /manager|director|lead|head|specialist/i.test(title));
  return (strong.length ? strong : titles).slice(0, 4);
}

export function detectYears(text) {
  const explicit = [...String(text || "").matchAll(/\b(\d{1,2})\s*\+?\s*(?:years|yrs)\b/gi)]
    .map((match) => Number(match[1]))
    .filter((years) => years > 0 && years < 60);
  if (explicit.length) return Math.max(...explicit);
  const years = [...String(text || "").matchAll(/\b((?:19|20)\d{2})\b/g)].map((match) => Number(match[1]));
  if (!years.length) return null;
  const current = new Date().getFullYear();
  const newest = /present|current/i.test(text) ? current : Math.max(...years);
  const span = newest - Math.min(...years);
  if (span > 0 && span < 60) return span;
  return null;
}

export function detectName(text) {
  const lines = String(text || "")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
  for (const line of lines) {
    const labeled = line.match(/^(?:name)\s*:\s*(.+)$/i);
    const candidate = (labeled ? labeled[1] : line).trim();
    if (SKIP_LINE.test(candidate)) continue;
    const full = candidate.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){1,3})(?=\s|$)/);
    if (!full) continue;
    const name = full[1];
    const rest = candidate.slice(name.length).trim();
    if (rest && !/^[a-z(]/.test(rest)) continue;
    if (ROLE_WORD.test(name)) continue;
    if (hasPhrase(name, "shopify") || /amazon|ecommerce|n8n/i.test(name)) continue;
    return name;
  }
  return "";
}

export function detectEmail(text) {
  const match = String(text || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
}

export function detectPhone(text) {
  const match = String(text || "").match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}/);
  return match ? match[0].trim() : "";
}

export function detectHighlights(text) {
  const highlights = [];
  for (const rawLine of String(text || "").split(/\n/)) {
    const line = rawLine.trim().replace(/^[\-*•]\s*/, "");
    if (line.length < 40 || line.length > 180) continue;
    if (SKIP_LINE.test(line)) continue;
    if (/^target roles?:/i.test(rawLine.trim())) continue;
    highlights.push(line.replace(/\s+/g, " "));
    if (highlights.length === 4) break;
  }
  return highlights;
}

function quoteTerm(term) {
  return /\s/.test(term) ? `"${term}"` : term;
}

export function buildQuery(titles, skills, extraTerms = []) {
  const roleGroup = titles.slice(0, 4).map(quoteTerm);
  const skillGroup = [...skills.slice(0, 6), ...extraTerms.slice(0, 4)].map(quoteTerm);
  const parts = [];
  if (roleGroup.length) parts.push(`(${roleGroup.join(" OR ")})`);
  if (skillGroup.length) parts.push(`(${[...new Set(skillGroup)].join(" OR ")})`);
  return parts.join(" AND ");
}

export function parseExtraTerms(value) {
  return String(value || "")
    .split(/[,;\n]/)
    .map((term) => term.trim().replace(/\s+/g, " "))
    .filter((term) => term.length > 1 && term.length <= 40)
    .slice(0, 8);
}

export function analyzeResume(text, extraTerms = []) {
  const rawText = String(text || "").replace(/\r\n/g, "\n").trim();
  const skills = detectSkills(rawText);
  const titles = detectTitles(rawText);
  const searchTitles = searchTitlesFrom(titles);
  const extras = parseExtraTerms(Array.isArray(extraTerms) ? extraTerms.join(", ") : extraTerms);
  const sharpSkills = skills.filter((skill) => DISTINCTIVE.has(skill));
  const querySkills = (sharpSkills.length ? sharpSkills : skills).slice(0, 6);
  return {
    name: detectName(rawText),
    email: detectEmail(rawText),
    phone: detectPhone(rawText),
    years: detectYears(rawText),
    skills,
    titles,
    searchTitles,
    extraTerms: extras,
    highlights: detectHighlights(rawText),
    query: buildQuery(searchTitles, querySkills, extras),
    rawText,
    resumeFile: "",
    sample: false,
    updatedAt: new Date().toISOString(),
  };
}

export function feedTerms(profile) {
  const terms = [];
  for (const skill of profile.skills || []) {
    if (DISTINCTIVE.has(skill)) terms.push(skill);
  }
  for (const title of profile.searchTitles || []) {
    const folded = title.toLowerCase();
    if (folded.includes("amazon")) terms.push("amazon");
    else if (folded.includes("shopify")) terms.push("shopify");
    else if (folded.includes("commerce")) terms.push("ecommerce");
    else terms.push(title.split(/\s+/)[0]);
  }
  for (const extra of profile.extraTerms || []) terms.push(extra);
  const unique = [];
  for (const term of terms) {
    const clean = term.trim();
    if (!clean) continue;
    if (unique.some((item) => item.toLowerCase() === clean.toLowerCase())) continue;
    unique.push(clean);
  }
  return unique.slice(0, 4);
}
