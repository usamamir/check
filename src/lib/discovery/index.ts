import { BraveSearchSource } from "./brave";
import { SerpApiSource } from "./serpapi";
import { GoogleCseSource } from "./google-cse";
import { ManualImportSource } from "./manual";
import { generateNicheQueries, generateSimilarQueries } from "./queries";
import { dedupeDomains, isBlockedDomain } from "./blocklist";
import type { DiscoveryCandidate, DiscoverySource } from "./types";
import { getBlocklist } from "@/lib/db/settings";

export * from "./types";
export * from "./manual";
export * from "./queries";
export * from "./blocklist";

export function getDiscoverySources(): DiscoverySource[] {
  return [new BraveSearchSource(), new SerpApiSource(), new GoogleCseSource(), new ManualImportSource()];
}

export function getConfiguredSearchSources(): DiscoverySource[] {
  return getDiscoverySources().filter((s) => s.id !== "manual" && s.isConfigured());
}

export async function discoverForNiche(opts: {
  niche: string;
  keywords?: string[];
  sources?: string[];
  targetCount?: number;
  onProgress?: (msg: string, candidates: DiscoveryCandidate[]) => void;
}): Promise<DiscoveryCandidate[]> {
  const queries = generateNicheQueries(opts.niche, opts.keywords || []);
  const allSources = getConfiguredSearchSources().filter(
    (s) => !opts.sources?.length || opts.sources.includes(s.id)
  );
  const blocklist = getBlocklist();
  const collected: DiscoveryCandidate[] = [];
  const target = opts.targetCount ?? 50;

  if (!allSources.length) {
    opts.onProgress?.(
      "No search API keys configured. Use Manual Import, or add Brave/SerpAPI/Google CSE keys in Settings.",
      []
    );
    return [];
  }

  for (const query of queries) {
    if (collected.length >= target) break;
    for (const source of allSources) {
      if (collected.length >= target) break;
      try {
        opts.onProgress?.(`Searching via ${source.name}: ${query}`, collected);
        const results = await source.search(query, { limit: 10 });
        for (const r of results) {
          if (isBlockedDomain(r.domain, blocklist)) continue;
          collected.push(r);
        }
      } catch (err) {
        opts.onProgress?.(
          `Source ${source.name} failed: ${err instanceof Error ? err.message : String(err)}`,
          collected
        );
      }
    }
  }

  return dedupeDomains(collected).slice(0, target) as DiscoveryCandidate[];
}

export async function discoverSimilar(opts: {
  niche?: string | null;
  categories?: string[];
  brandKeywords?: string[];
  targetCount?: number;
}): Promise<DiscoveryCandidate[]> {
  const queries = generateSimilarQueries(opts);
  const sources = getConfiguredSearchSources();
  const blocklist = getBlocklist();
  const collected: DiscoveryCandidate[] = [];
  for (const query of queries) {
    for (const source of sources) {
      try {
        const results = await source.search(query, { limit: 8 });
        for (const r of results) {
          if (!isBlockedDomain(r.domain, blocklist)) collected.push(r);
        }
      } catch {
        // continue
      }
      if (collected.length >= (opts.targetCount ?? 30)) break;
    }
  }
  return dedupeDomains(collected).slice(0, opts.targetCount ?? 30) as DiscoveryCandidate[];
}
