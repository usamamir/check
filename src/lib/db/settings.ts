import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { settings } from "./schema";
import { DEFAULT_SCORE_WEIGHTS, DEFAULT_BLOCKLIST } from "./defaults";
import { safeJsonParse } from "@/lib/utils";

export function getSetting(key: string, fallback = ""): string {
  const db = getDb();
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? fallback;
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.select().from(settings).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string) {
  const db = getDb();
  const now = Date.now();
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, key)).run();
  } else {
    db.insert(settings).values({ key, value, updatedAt: now }).run();
  }
}

export function setSettings(patch: Record<string, string>) {
  for (const [key, value] of Object.entries(patch)) {
    setSetting(key, value);
  }
}

export function getScoreWeights() {
  return {
    ...DEFAULT_SCORE_WEIGHTS,
    ...safeJsonParse(getSetting("score_weights"), {}),
  };
}

export function getBlocklist(): string[] {
  return safeJsonParse(getSetting("domain_blocklist"), DEFAULT_BLOCKLIST);
}

export function getUserAgent(): string {
  const contact = getSetting("user_agent_contact", "you@example.com");
  return `SupplyScoutBot/1.0 (+contact: ${contact})`;
}
