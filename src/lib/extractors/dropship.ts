export type DropshipEvidence = {
  type: "positive" | "medium" | "negative";
  phrase: string;
  snippet: string;
};

const STRONG: string[] = [
  "dropship program",
  "drop ship program",
  "we dropship",
  "we drop ship",
  "drop ship for retailers",
  "dropship for retailers",
  "dropshipping partner",
  "dropship partner",
  "blind shipping",
  "ship directly to your customers",
  "ships directly to your customers",
  "dropship application",
  "drop ship application",
  "become a dropshipper",
  "inventory source",
  "flxpoint",
  "modalyst",
  "spocket",
  "syncee",
  "faire.com",
  "crov",
  "trendsi",
];

const MEDIUM: string[] = [
  "wholesale program",
  "reseller program",
  "dealer program",
  "become a retailer",
  "become a dealer",
  "become a reseller",
  "authorized retailer",
  "map policy",
  "minimum advertised price",
  "b2b portal",
  "wholesale pricing",
  "trade account",
  "distributor program",
  "partner program",
];

const NEGATIVE: string[] = [
  "we do not dropship",
  "we don't dropship",
  "do not dropship",
  "no dropshipping",
  "no dropshipping allowed",
  "authorized retailers only, no online resellers",
  "not accepting new retailers",
  "amazon sellers prohibited",
  "we do not offer dropshipping",
  "dropshipping is not available",
];

function snippetAround(text: string, idx: number, len: number): string {
  const start = Math.max(0, idx - 80);
  const end = Math.min(text.length, idx + len + 80);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

export function detectDropshipSignals(text: string): DropshipEvidence[] {
  const lower = text.toLowerCase();
  const results: DropshipEvidence[] = [];
  const seen = new Set<string>();

  const push = (type: DropshipEvidence["type"], phrases: string[]) => {
    for (const phrase of phrases) {
      let from = 0;
      while (true) {
        const idx = lower.indexOf(phrase, from);
        if (idx === -1) break;
        const key = `${type}:${phrase}:${idx}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            type,
            phrase,
            snippet: snippetAround(text, idx, phrase.length),
          });
        }
        from = idx + phrase.length;
      }
    }
  };

  push("negative", NEGATIVE);
  push("positive", STRONG);
  push("medium", MEDIUM);

  // EDI as strong when near wholesale/dropship context
  if (/\bedi\b/i.test(text) && /(wholesale|drop\s?ship|b2b|retailer)/i.test(text)) {
    results.push({
      type: "positive",
      phrase: "EDI",
      snippet: "EDI mentioned near wholesale/dropship context",
    });
  }

  return results;
}

export function summarizeDropshipStatus(
  evidence: DropshipEvidence[]
): "yes" | "likely" | "wholesale_only" | "no" | "unknown" {
  const neg = evidence.filter((e) => e.type === "negative").length;
  const pos = evidence.filter((e) => e.type === "positive").length;
  const med = evidence.filter((e) => e.type === "medium").length;

  if (neg > 0 && pos === 0) return "no";
  if (pos >= 2) return "yes";
  if (pos >= 1) return "likely";
  if (med >= 1 && pos === 0) return "wholesale_only";
  return "unknown";
}

export function dropshipEvidenceScore(evidence: DropshipEvidence[]): number {
  let score = 0;
  for (const e of evidence) {
    if (e.type === "positive") score += 12;
    else if (e.type === "medium") score += 5;
    else if (e.type === "negative") score -= 20;
  }
  return Math.max(0, Math.min(40, score));
}
