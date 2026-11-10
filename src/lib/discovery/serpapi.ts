import { getSetting } from "@/lib/db/settings";
import { rootDomain } from "@/lib/utils";
import type { DiscoveryCandidate, DiscoverySearchOptions, DiscoverySource } from "./types";

export class SerpApiSource implements DiscoverySource {
  id = "serpapi";
  name = "SerpAPI";

  isConfigured() {
    return Boolean(getSetting("serpapi_api_key") || process.env.SERPAPI_API_KEY);
  }

  async search(query: string, options: DiscoverySearchOptions = {}): Promise<DiscoveryCandidate[]> {
    const key = getSetting("serpapi_api_key") || process.env.SERPAPI_API_KEY || "";
    if (!key) return [];
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(key)}&num=${Math.min(options.limit ?? 10, 20)}`;
    const res = await fetch(url, { signal: options.signal });
    if (!res.ok) {
      throw new Error(`SerpAPI error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      organic_results?: Array<{ link: string; title?: string; snippet?: string }>;
    };
    return (data.organic_results ?? []).map((r) => ({
      domain: rootDomain(r.link),
      title: r.title,
      snippet: r.snippet,
      url: r.link,
      source: this.id,
    }));
  }
}
