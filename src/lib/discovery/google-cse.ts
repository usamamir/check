import { getSetting } from "@/lib/db/settings";
import { rootDomain } from "@/lib/utils";
import type { DiscoveryCandidate, DiscoverySearchOptions, DiscoverySource } from "./types";

export class GoogleCseSource implements DiscoverySource {
  id = "google_cse";
  name = "Google Programmable Search";

  isConfigured() {
    const key = getSetting("google_cse_api_key") || process.env.GOOGLE_CSE_API_KEY;
    const cx = getSetting("google_cse_cx") || process.env.GOOGLE_CSE_CX;
    return Boolean(key && cx);
  }

  async search(query: string, options: DiscoverySearchOptions = {}): Promise<DiscoveryCandidate[]> {
    const key = getSetting("google_cse_api_key") || process.env.GOOGLE_CSE_API_KEY || "";
    const cx = getSetting("google_cse_cx") || process.env.GOOGLE_CSE_CX || "";
    if (!key || !cx) return [];
    const num = Math.min(options.limit ?? 10, 10);
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${num}`;
    const res = await fetch(url, { signal: options.signal });
    if (!res.ok) {
      throw new Error(`Google CSE error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      items?: Array<{ link: string; title?: string; snippet?: string }>;
    };
    return (data.items ?? []).map((r) => ({
      domain: rootDomain(r.link),
      title: r.title,
      snippet: r.snippet,
      url: r.link,
      source: this.id,
    }));
  }
}
