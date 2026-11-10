export type ExtractedEmail = {
  email: string;
  label: string;
  confidence: number;
  sourceHint?: string;
};

const EMAIL_RE =
  /([a-zA-Z0-9._%+\-]+)\s*(?:@|\(at\)|\[at\]|\s+at\s+)\s*([a-zA-Z0-9.\-]+)\s*(?:\.|\(dot\)|\[dot\]|\s+dot\s+)\s*([a-zA-Z]{2,})/gi;

const SIMPLE_EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const MAILTO_RE = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;

const ROLE_RANK: Record<string, { label: string; score: number }> = {
  wholesale: { label: "wholesale", score: 1 },
  dropship: { label: "dropship", score: 1 },
  dropshipping: { label: "dropship", score: 1 },
  partners: { label: "partners", score: 0.95 },
  partner: { label: "partners", score: 0.95 },
  sales: { label: "sales", score: 0.9 },
  b2b: { label: "b2b", score: 0.9 },
  dealer: { label: "dealer", score: 0.85 },
  trade: { label: "trade", score: 0.85 },
  info: { label: "info", score: 0.6 },
  hello: { label: "hello", score: 0.55 },
  contact: { label: "contact", score: 0.55 },
  support: { label: "support", score: 0.35 },
  help: { label: "support", score: 0.3 },
};

const FREE_MAIL = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
]);

/** Decode Cloudflare email-protection encoded addresses. */
export function decodeCloudflareEmail(encoded: string): string | null {
  try {
    const r = parseInt(encoded.slice(0, 2), 16);
    let email = "";
    for (let n = 2; n < encoded.length; n += 2) {
      const charCode = parseInt(encoded.slice(n, n + 2), 16) ^ r;
      email += String.fromCharCode(charCode);
    }
    const normalized = email.toLowerCase();
    return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(normalized)
      ? normalized
      : null;
  } catch {
    return null;
  }
}

const BAD_EMAIL_RE =
  /\.(png|jpe?g|gif|webp|svg|js|css)$|@(checkout|parentnode|once|www)\.|@.*\.(var|for|currency|select|by|please|if|we|in|the|when|passport)$/i;

function looksLikeRealEmail(email: string): boolean {
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,24}$/i.test(email)) return false;
  if (BAD_EMAIL_RE.test(email)) return false;
  if (email.split("@")[1]?.split(".").some((p) => p.length < 2)) return false;
  // reject obvious JS leftovers like help@domain.com.please
  const tld = email.split(".").pop() || "";
  const commonTlds = new Set([
    "com", "net", "org", "io", "co", "us", "biz", "info", "shop", "store", "co.uk", "edu", "gov",
  ]);
  if (!commonTlds.has(tld) && tld.length > 4) return false;
  return true;
}

export function deobfuscateEmailText(text: string): string[] {
  const found = new Set<string>();

  for (const m of text.matchAll(MAILTO_RE)) {
    found.add(m[1].toLowerCase());
  }

  for (const m of text.matchAll(SIMPLE_EMAIL_RE)) {
    found.add(m[0].toLowerCase());
  }

  for (const m of text.matchAll(EMAIL_RE)) {
    const email = `${m[1]}@${m[2]}.${m[3]}`.toLowerCase().replace(/\s+/g, "");
    if (/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(email)) found.add(email);
  }

  // Cloudflare data-cfemail attributes
  const cfRe = /data-cfemail=["']([a-f0-9]+)["']/gi;
  for (const m of text.matchAll(cfRe)) {
    const decoded = decodeCloudflareEmail(m[1]);
    if (decoded) found.add(decoded);
  }

  return Array.from(found).filter(looksLikeRealEmail);
}

export function classifyEmail(email: string): ExtractedEmail {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const base = local.split(/[.+]/)[0] ?? local;
  const ranked = ROLE_RANK[base] ?? { label: "other", score: 0.4 };
  const free = FREE_MAIL.has(domain);
  return {
    email,
    label: ranked.label,
    confidence: free ? ranked.score * 0.5 : ranked.score,
  };
}

export function extractEmails(htmlOrText: string): ExtractedEmail[] {
  const raw = deobfuscateEmailText(htmlOrText);
  const mapped = raw.map(classifyEmail);
  mapped.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<string>();
  return mapped.filter((e) => {
    if (seen.has(e.email)) return false;
    seen.add(e.email);
    return true;
  });
}

export function isFreeMail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return FREE_MAIL.has(domain);
}
