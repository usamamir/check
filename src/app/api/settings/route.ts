import { NextResponse } from "next/server";
import { bootServer } from "@/lib/server";
import { getAllSettings, setSettings } from "@/lib/db/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET_KEYS = new Set([
  "brave_search_api_key",
  "serpapi_api_key",
  "google_cse_api_key",
  "llm_api_key",
  "smtp_pass",
]);

export async function GET() {
  bootServer();
  const all = getAllSettings();
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(all)) {
    if (SECRET_KEYS.has(k) && v) {
      masked[k] = v.length <= 4 ? "****" : `${"*".repeat(Math.min(12, v.length - 4))}${v.slice(-4)}`;
      masked[`${k}__set`] = "1";
    } else {
      masked[k] = v;
    }
  }
  return NextResponse.json(masked);
}

export async function PUT(req: Request) {
  bootServer();
  const body = (await req.json()) as Record<string, string>;
  const patch: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k.endsWith("__set")) continue;
    // skip unchanged masked secrets
    if (SECRET_KEYS.has(k) && typeof v === "string" && v.includes("*")) continue;
    patch[k] = String(v ?? "");
  }
  setSettings(patch);
  return NextResponse.json({ ok: true });
}
