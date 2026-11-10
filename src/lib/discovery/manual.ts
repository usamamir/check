import { rootDomain } from "@/lib/utils";
import type { DiscoveryCandidate, DiscoverySource } from "./types";

export function parseManualDomains(input: string): string[] {
  const lines = input
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const domains: string[] = [];
  for (const line of lines) {
    // skip header-ish
    if (/^domain$/i.test(line) || /^url$/i.test(line) || /^website$/i.test(line)) continue;
    const parts = line.split(/[\t,]/);
    const candidate = parts.find((p) => /[a-z0-9.-]+\.[a-z]{2,}/i.test(p)) || parts[0];
    const d = rootDomain(candidate.replace(/^["']|["']$/g, ""));
    if (d && d.includes(".")) domains.push(d);
  }
  return [...new Set(domains)];
}

export class ManualImportSource implements DiscoverySource {
  id = "manual";
  name = "Manual import";

  isConfigured() {
    return true;
  }

  async search(): Promise<DiscoveryCandidate[]> {
    return [];
  }

  fromText(input: string): DiscoveryCandidate[] {
    return parseManualDomains(input).map((domain) => ({
      domain,
      source: this.id,
      url: `https://${domain}`,
    }));
  }
}
