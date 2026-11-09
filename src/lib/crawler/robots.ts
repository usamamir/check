import robotsParser from "robots-parser";
import { getUserAgent } from "@/lib/db/settings";

const cache = new Map<string, ReturnType<typeof robotsParser> | null>();

export async function getRobots(origin: string): Promise<ReturnType<typeof robotsParser> | null> {
  if (cache.has(origin)) return cache.get(origin) ?? null;
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": getUserAgent() },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      cache.set(origin, null);
      return null;
    }
    const text = await res.text();
    const robots = robotsParser(`${origin}/robots.txt`, text);
    cache.set(origin, robots);
    return robots;
  } catch {
    cache.set(origin, null);
    return null;
  }
}

export async function isUrlAllowed(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const robots = await getRobots(u.origin);
    if (!robots) return true;
    return robots.isAllowed(url, getUserAgent()) !== false;
  } catch {
    return true;
  }
}
