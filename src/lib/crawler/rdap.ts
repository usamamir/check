export async function fetchDomainAgeYears(domain: string): Promise<number | null> {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
    };
    const reg = data.events?.find((e) => e.eventAction === "registration");
    if (!reg?.eventDate) return null;
    const created = new Date(reg.eventDate).getTime();
    if (Number.isNaN(created)) return null;
    const years = (Date.now() - created) / (365.25 * 24 * 3600 * 1000);
    return Math.round(years * 10) / 10;
  } catch {
    return null;
  }
}
