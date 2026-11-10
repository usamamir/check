export type SocialLink = {
  network: string;
  url: string;
};

const NETWORKS: Array<{ network: string; re: RegExp }> = [
  { network: "instagram", re: /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.\-]+\/?/gi },
  { network: "facebook", re: /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9_.\-]+\/?/gi },
  { network: "tiktok", re: /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9_.\-]+\/?/gi },
  { network: "linkedin", re: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_.\-]+\/?/gi },
  { network: "youtube", re: /https?:\/\/(?:www\.)?youtube\.com\/(?:c|channel|user|@)[A-Za-z0-9_.\-\/]+/gi },
];

export function extractSocialLinks(html: string): SocialLink[] {
  const out: SocialLink[] = [];
  const seen = new Set<string>();
  for (const n of NETWORKS) {
    for (const m of html.matchAll(n.re)) {
      const url = m[0].replace(/[)\]>",']+$/, "");
      if (seen.has(url)) continue;
      // skip share/intent noise
      if (/\/sharer|\/share|\/intent\//i.test(url)) continue;
      seen.add(url);
      out.push({ network: n.network, url });
    }
  }
  return out;
}
