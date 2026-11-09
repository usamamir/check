import { rootDomain } from "@/lib/utils";
import { getBlocklist } from "@/lib/db/settings";

export function isBlockedDomain(domainOrUrl: string, blocklist?: string[]): boolean {
  const list = (blocklist ?? getBlocklist()).map((d) => d.toLowerCase());
  const d = rootDomain(domainOrUrl);
  return list.some((b) => d === b || d.endsWith(`.${b}`));
}

export function dedupeDomains(
  candidates: Array<{ domain: string; [k: string]: unknown }>
): Array<{ domain: string; [k: string]: unknown }> {
  const seen = new Set<string>();
  const out: Array<{ domain: string; [k: string]: unknown }> = [];
  for (const c of candidates) {
    const d = rootDomain(String(c.domain));
    if (!d || seen.has(d)) continue;
    seen.add(d);
    out.push({ ...c, domain: d });
  }
  return out;
}
