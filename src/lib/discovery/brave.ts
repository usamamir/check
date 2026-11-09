import { getSetting } from "@/lib/db/settings";
import { rootDomain } from "@/lib/utils";
import type { DiscoveryCandidate, DiscoverySearchOptions, DiscoverySource } from "./types";

export class BraveSearchSource implements DiscoverySource {
  id = "brave";
  name = "Brave Search API";

  isConfigured() {
    return Boolean(getSetting("brave_search_api_key") || process.env.BRAVE_SEARCH_API_KEY);
  }

  async search(query: string, options: DiscoverySearchOptions = {}): Promise<DiscoveryCandidate[]> {
    const key = getSetting("brave_search_api_key") || process.env.BRAVE_SEARCH_API_KEY || "";
    if (!key) return [];
    const count = Math.min(options.limit ?? 20, 20);
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": key,
      },
      signal: options.signal,
    });
    if (!res.ok) {
      throw new Error(`Brave Search error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      web?: { results?: Array<{ url: string; title?: string; description?: string }> };
    };
    return (data.web?.results ?? []).map((r) => ({
      domain: rootDomain(r.url),
      title: r.title,
      snippet: r.description,
      url: r.url,
      source: this.id,
    }));
  }
}
