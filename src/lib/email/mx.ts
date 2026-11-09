import dns from "dns/promises";

export async function resolveMxSafe(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const mx = await dns.resolveMx(domain);
    return Array.isArray(mx) && mx.length > 0;
  } catch {
    try {
      const a = await dns.resolve4(domain);
      return Array.isArray(a) && a.length > 0;
    } catch {
      return false;
    }
  }
}
