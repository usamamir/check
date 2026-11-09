export type OwnerResult = {
  name: string;
  role: string;
  confidence: number;
  sourceHint?: string;
};

const PATTERNS: Array<{ re: RegExp; role: string; confidence: number }> = [
  {
    re: /founded by\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/g,
    role: "Founder",
    confidence: 0.85,
  },
  {
    re: /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}),?\s+(?:Founder(?:\s*&\s*CEO)?|CEO\s*&\s*Founder|Co-Founder)/g,
    role: "Founder",
    confidence: 0.9,
  },
  {
    re: /owner\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/gi,
    role: "Owner",
    confidence: 0.7,
  },
  {
    re: /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\s+is\s+the\s+(?:founder|owner|ceo)/gi,
    role: "Founder",
    confidence: 0.8,
  },
];

const BAD_NAME =
  /\b(the|and|our|this|that|with|from|your|their|intellectual|authorized|user|company|team|page)\b/i;

export function extractOwnerFromText(text: string): OwnerResult | null {
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    const m = p.re.exec(text);
    if (m?.[1]) {
      const name = m[1].trim();
      const parts = name.split(/\s+/);
      if (
        parts.length >= 2 &&
        name.length > 3 &&
        name.length < 60 &&
        !BAD_NAME.test(name)
      ) {
        return { name, role: p.role, confidence: p.confidence };
      }
    }
  }
  return null;
}

export function extractOwnerFromJsonLd(html: string): OwnerResult | null {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      const data = JSON.parse(s[1]);
      const nodes = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
      for (const node of nodes) {
        if (!node) continue;
        if (node["@type"] === "Person" && node.name) {
          return {
            name: String(node.name),
            role: String(node.jobTitle || node.role || "Person"),
            confidence: 0.75,
            sourceHint: "json-ld Person",
          };
        }
        if (node["@type"] === "Organization" && node.founder) {
          const f = Array.isArray(node.founder) ? node.founder[0] : node.founder;
          const name = typeof f === "string" ? f : f?.name;
          if (name) {
            return {
              name: String(name),
              role: "Founder",
              confidence: 0.8,
              sourceHint: "json-ld Organization.founder",
            };
          }
        }
      }
    } catch {
      // ignore bad JSON-LD
    }
  }

  const author = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']author["']/i);
  if (author?.[1] && author[1].split(" ").length <= 4) {
    return { name: author[1].trim(), role: "Author", confidence: 0.4, sourceHint: "meta author" };
  }

  return null;
}

export function extractOwner(html: string, text: string): OwnerResult | null {
  return extractOwnerFromJsonLd(html) || extractOwnerFromText(text);
}
