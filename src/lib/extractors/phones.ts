import { parsePhoneNumberFromString } from "libphonenumber-js";

export type ExtractedPhone = {
  phone: string;
  e164: string;
  country: "US" | "CA" | string;
  confidence: number;
};

const PHONE_CANDIDATE_RE =
  /(?:\+?1[\s\-.]*)?(?:\(?\d{3}\)?[\s\-.]*)\d{3}[\s\-.]*\d{4}/g;

export function extractPhones(text: string): ExtractedPhone[] {
  const found: ExtractedPhone[] = [];
  const seen = new Set<string>();

  for (const m of text.matchAll(PHONE_CANDIDATE_RE)) {
    const raw = m[0];
    const parsed = parsePhoneNumberFromString(raw, "US");
    if (!parsed || !parsed.isValid()) continue;
    if (parsed.country !== "US" && parsed.country !== "CA") continue;
    const e164 = parsed.format("E.164");
    if (seen.has(e164)) continue;
    seen.add(e164);
    found.push({
      phone: parsed.formatNational(),
      e164,
      country: parsed.country ?? "US",
      confidence: 0.8,
    });
  }

  return found;
}
