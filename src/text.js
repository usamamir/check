const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z]+);/gi, (full, name) => NAMED_ENTITIES[name.toLowerCase()] ?? full)
    .replace(/&#(\d+);/g, (_, num) => {
      const code = Number(num);
      return code > 0 && code < 65536 ? String.fromCharCode(code) : "";
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/e-commerce/g, "ecommerce")
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasPhrase(haystack, needle) {
  const hay = normalize(haystack);
  const pin = normalize(needle);
  if (!hay || !pin) return false;
  const escaped = pin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(hay);
}

export function sentencesOf(value) {
  const plain = stripHtml(value);
  return plain
    .split(/\n+|(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 25 && !/^https?:/i.test(sentence));
}

const REQUIREMENT = /looking for|you will|you'll|responsible|requirement|must |experience with|ideal candidate|own the|ownership|we need/i;
const BOILER = /equal opportunity|all rights reserved|cookie|privacy policy|benefits include|we offer|401\(k\)|health insurance|authorized to work|our team|about us/i;

export function focusLine(value) {
  const sentences = sentencesOf(value).filter((sentence) => sentence.length < 280);
  if (!sentences.length) return "";
  const ranked = sentences
    .map((sentence) => {
      let score = 0;
      if (REQUIREMENT.test(sentence)) score += 5;
      if (BOILER.test(sentence)) score -= 4;
      if (sentence.length > 180) score -= 1;
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length);
  const best = ranked[0];
  if (!best || best.score < 0) return sentences[0].slice(0, 220);
  return best.sentence.slice(0, 220);
}

export function summarize(value) {
  const focus = focusLine(value);
  if (focus) return focus;
  return stripHtml(value).replace(/\s+/g, " ").trim().slice(0, 220);
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function usableEmail(email) {
  if (!email || !email.includes("@")) return false;
  const [local, domain] = email.toLowerCase().split("@");
  if (!local || !domain) return false;
  if (/noreply|no-reply|donotreply|do-not-reply/.test(local)) return false;
  if (/(^|\.)((example|email|sentry|wixpress|schema)\.(com|org|io))$/.test(domain)) return false;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return false;
  return true;
}

export function findEmails(value) {
  const found = stripHtml(value).match(EMAIL_RE) || [];
  const unique = [];
  for (const email of found) {
    const clean = email.replace(/[),.;]+$/, "");
    if (!usableEmail(clean)) continue;
    if (!unique.some((item) => item.toLowerCase() === clean.toLowerCase())) unique.push(clean);
  }
  return unique;
}

export function formatList(items) {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] || "";
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

export function csvField(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
