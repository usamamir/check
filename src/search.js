import { createHash } from "node:crypto";
import { feedTerms, isDistinctive, skillWeight } from "./analyze.js";
import { findEmails, hasPhrase, normalize, stripHtml } from "./text.js";

const USER_AGENT = "Daybook/1.0 (local job search; resume text stays on the machine)";

export function jobKey(job) {
  if (job.url) {
    try {
      const url = new URL(job.url);
      return `${url.hostname}${url.pathname}`.toLowerCase().replace(/\/$/, "");
    } catch {
      return String(job.url).toLowerCase();
    }
  }
  return `${job.company || ""}|${job.title || ""}`.toLowerCase().replace(/\s+/g, " ").trim();
}

export function jobId(job) {
  return createHash("sha256").update(jobKey(job)).digest("hex").slice(0, 16);
}

export function extractContact(description, ignoreEmail = "") {
  const emails = findEmails(description).filter(
    (email) => email.toLowerCase() !== String(ignoreEmail || "").toLowerCase(),
  );
  const plain = stripHtml(description);
  const named = plain.match(
    /(?:[Hh]iring [Mm]anager|[Rr]ecruiter|[Cc]ontact)\s*[:\-–]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/,
  );
  let contactName = named ? named[1].trim() : "";
  if (/^(Hiring|The|Our|Team|Manager)\b/.test(contactName)) contactName = "";
  const phoneMatch = plain.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-])\d{3}[\s.-]\d{4}/);
  const linkedinMatch = plain.match(/https?:\/\/(?:[\w.-]+\.)?linkedin\.com\/[^\s<>"')]+/i);
  return {
    contactEmail: emails[0] || "",
    contactName,
    contactPhone: phoneMatch ? phoneMatch[0].trim() : "",
    contactLinkedin: linkedinMatch ? linkedinMatch[0].replace(/[.,;]+$/, "") : "",
  };
}

export function scoreJob(job, profile) {
  const matched = [];
  let matchScore = 0;
  const title = `${job.title || ""}`;
  const body = `${job.title || ""}\n${job.description || ""}`;
  const titleHit = (profile.searchTitles || []).some((titleTerm) => hasPhrase(title, titleTerm));
  for (const searchTitle of profile.searchTitles || []) {
    if (hasPhrase(title, searchTitle)) {
      matchScore += 36;
      matched.push(searchTitle);
    }
  }
  const distinctiveInBody = [];
  let distinctiveInTitle = false;
  for (const skill of profile.skills || []) {
    const where = hasPhrase(title, skill) ? "title" : hasPhrase(body, skill) ? "body" : "";
    if (!where) continue;
    matchScore += skillWeight(skill, where);
    matched.push(skill);
    if (isDistinctive(skill) && where === "title") distinctiveInTitle = true;
    if (isDistinctive(skill) && where === "body") distinctiveInBody.push(skill);
  }
  for (const extra of profile.extraTerms || []) {
    if (hasPhrase(title, extra) || hasPhrase(body, extra)) {
      matchScore += 10;
      matched.push(extra);
    }
  }
  const foldedTitle = normalize(title);
  const commerceTitle = /ecommerce|shopify|amazon|marketplace|merchant/.test(foldedTitle);
  const roleTitle = /manager|director|lead|head|specialist|owner|vp|president/.test(foldedTitle);
  if (commerceTitle && roleTitle && !titleHit) matchScore += 28;
  const unique = [];
  for (const term of matched) {
    if (!unique.some((item) => item.toLowerCase() === term.toLowerCase())) unique.push(term);
  }
  const relevant = titleHit
    || distinctiveInTitle
    || (commerceTitle && roleTitle)
    || (distinctiveInBody.length >= 2 && roleTitle);
  return {
    matchScore: Math.min(100, matchScore),
    matchedTerms: unique.slice(0, 8),
    relevant,
  };
}

function withinDays(postedAt, now, days) {
  if (!postedAt) return false;
  const time = new Date(postedAt).getTime();
  if (Number.isNaN(time)) return false;
  const age = now - time;
  return age >= -60 * 60 * 1000 && age <= days * 24 * 60 * 60 * 1000;
}

export function prepareJob(raw, profile, now = Date.now()) {
  const description = stripHtml(raw.description || "").slice(0, 12000);
  const contact = extractContact(description, profile.email);
  const scored = scoreJob({ ...raw, description }, profile);
  return {
    id: jobId(raw),
    source: raw.source,
    title: String(raw.title || "").replace(/\s+/g, " ").trim(),
    company: String(raw.company || "Unknown company").replace(/\s+/g, " ").trim(),
    location: String(raw.location || "").replace(/\s+/g, " ").trim(),
    url: raw.url || "",
    postedAt: raw.postedAt || "",
    description,
    summary: "",
    contactName: contact.contactName,
    contactEmail: contact.contactEmail,
    contactPhone: contact.contactPhone,
    contactLinkedin: contact.contactLinkedin,
    matchScore: scored.matchScore,
    matchedTerms: scored.matchedTerms,
    relevant: scored.relevant,
    status: "new",
    coverLetter: "",
    draftFile: "",
    firstSeenAt: new Date(now).toISOString(),
  };
}

export function selectJobs(rawJobs, profile, { now = Date.now(), minimum = 5 } = {}) {
  const prepared = [];
  const seen = new Set();
  for (const raw of rawJobs) {
    if (!raw?.title) continue;
    const job = prepareJob(raw, profile, now);
    if (!job.relevant) continue;
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    prepared.push(job);
  }
  const pick = (days) =>
    prepared
      .filter((job) => withinDays(job.postedAt, now, days))
      .sort((a, b) => b.matchScore - a.matchScore || String(b.postedAt).localeCompare(String(a.postedAt)));
  const jobs = pick(3).slice(0, 150);
  return { jobs, windowDays: 3, considered: prepared.length, minimum };
}

async function getJson(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  }
  return response.json();
}

function asIso(value) {
  if (!value && value !== 0) return "";
  if (typeof value === "number") {
    const ms = value > 1e12 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function loadRemotive(term, fetchImpl) {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(term)}`;
  const data = await getJson(url, fetchImpl);
  return (data.jobs || []).map((job) => ({
    source: "Remotive",
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || "Remote",
    url: job.url,
    postedAt: asIso(job.publication_date),
    description: `${job.description || ""}\n${(job.tags || []).join(" ")}`,
  }));
}

async function loadRemoteOk(fetchImpl) {
  const data = await getJson("https://remoteok.com/api", fetchImpl);
  const rows = Array.isArray(data) ? data : [];
  return rows
    .filter((job) => job && job.position)
    .map((job) => ({
      source: "Remote OK",
      title: job.position,
      company: job.company,
      location: job.location || "Remote",
      url: job.url || job.apply_url,
      postedAt: asIso(job.epoch || job.date),
      description: `${job.description || ""}\n${(job.tags || []).filter((tag) => typeof tag === "string").join(" ")}`,
    }));
}

async function loadArbeitnow(fetchImpl) {
  const data = await getJson("https://www.arbeitnow.com/api/job-board-api", fetchImpl);
  return (data.data || []).map((job) => ({
    source: "Arbeitnow",
    title: job.title,
    company: job.company_name,
    location: job.location || (job.remote ? "Remote" : ""),
    url: job.url,
    postedAt: asIso(job.created_at),
    description: `${job.description || ""}\n${(job.tags || []).join(" ")}`,
  }));
}

async function loadMuse(page, fetchImpl) {
  const url = `https://www.themuse.com/api/public/jobs?page=${page}&descending=true`;
  const data = await getJson(url, fetchImpl);
  return (data.results || []).map((job) => ({
    source: "The Muse",
    title: job.name,
    company: job.company?.name,
    location: (job.locations || []).map((item) => item.name).filter(Boolean).join(", ") || "Remote",
    url: job.refs?.landing_page || "",
    postedAt: asIso(job.publication_date),
    description: `${job.contents || ""}\n${(job.categories || []).map((item) => item.name).join(" ")}`,
  }));
}

async function loadJobicy(tag, fetchImpl) {
  const url = `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(tag)}`;
  const data = await getJson(url, fetchImpl);
  return (data.jobs || []).map((job) => ({
    source: "Jobicy",
    title: job.jobTitle,
    company: job.companyName,
    location: job.jobGeo || "Remote",
    url: job.url,
    postedAt: asIso(job.pubDate),
    description: `${job.jobDescription || ""}\n${job.jobExcerpt || ""}`,
  }));
}

const JOBICY_TAGS = new Map([
  ["shopify", "shopify"],
  ["amazon", "amazon"],
  ["amazon seller central", "amazon"],
  ["ecommerce", "ecommerce"],
  ["e-commerce", "ecommerce"],
  ["n8n", "automation"],
  ["seo", "seo"],
  ["email marketing", "marketing"],
  ["paid media", "marketing"],
]);

export async function searchJobs(profile, { fetchImpl = fetch, now = Date.now() } = {}) {
  const terms = feedTerms(profile);
  const requests = [];
  const remotiveTerms = (terms.length ? terms : ["ecommerce"]).slice(0, 4);
  for (const term of remotiveTerms) {
    requests.push({ name: "Remotive", run: () => loadRemotive(term, fetchImpl) });
  }
  requests.push({ name: "Remote OK", run: () => loadRemoteOk(fetchImpl) });
  requests.push({ name: "Arbeitnow", run: () => loadArbeitnow(fetchImpl) });
  requests.push({ name: "The Muse", run: () => loadMuse(0, fetchImpl) });
  requests.push({ name: "The Muse", run: () => loadMuse(1, fetchImpl) });
  const jobicyTags = [];
  for (const term of terms) {
    const tag = JOBICY_TAGS.get(term.toLowerCase());
    if (tag && !jobicyTags.includes(tag)) jobicyTags.push(tag);
  }
  if (!jobicyTags.length) jobicyTags.push("ecommerce");
  for (const tag of jobicyTags.slice(0, 2)) {
    requests.push({ name: "Jobicy", run: () => loadJobicy(tag, fetchImpl) });
  }

  const settled = await Promise.allSettled(requests.map((request) => request.run()));
  const raw = [];
  const sources = [];
  settled.forEach((result, index) => {
    const name = requests[index].name;
    if (result.status === "fulfilled") {
      raw.push(...result.value);
      const existing = sources.find((source) => source.name === name && !source.error);
      if (existing) existing.count += result.value.length;
      else sources.push({ name, count: result.value.length });
    } else {
      const message = result.reason?.message || `${name} failed`;
      sources.push({ name, count: 0, error: message });
    }
  });

  const selected = selectJobs(raw, profile, { now });
    return {
    ...selected,
    errors: sources.filter((source) => source.error).map((source) => source.error),
    sources,
  };
}
