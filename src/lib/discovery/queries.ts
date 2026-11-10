export function generateNicheQueries(niche: string, extraKeywords: string[] = []): string[] {
  const n = niche.trim();
  const base = [
    `"${n}" "dropship program"`,
    `"${n}" "become a dropshipper"`,
    `"${n}" "dropshipping partners"`,
    `"${n}" "wholesale" "drop ship" USA`,
    `"${n}" "authorized retailer" "apply"`,
    `"${n}" "made in USA" wholesale`,
    `inurl:dropship "${n}"`,
    `inurl:wholesale "${n}"`,
    `"${n}" manufacturer "we dropship"`,
    `"${n}" "dropship application"`,
    `"${n}" "wholesale program" USA`,
    `"${n}" "reseller program"`,
    `"${n}" "B2B" wholesale`,
  ];

  for (const kw of extraKeywords) {
    if (!kw.trim()) continue;
    base.push(`"${n}" "${kw.trim()}" wholesale`);
    base.push(`"${n}" "${kw.trim()}" dropship`);
  }

  return [...new Set(base)];
}

export function generateSimilarQueries(opts: {
  niche?: string | null;
  categories?: string[];
  brandKeywords?: string[];
}): string[] {
  const parts: string[] = [];
  const niche = opts.niche || opts.categories?.[0] || "products";
  parts.push(...generateNicheQueries(niche, opts.brandKeywords?.slice(0, 3) || []));
  for (const cat of (opts.categories || []).slice(0, 3)) {
    parts.push(`"${cat}" "dropship program" USA`);
    parts.push(`"${cat}" wholesale manufacturer USA`);
  }
  return [...new Set(parts)].slice(0, 12);
}
