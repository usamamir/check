import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { desc } from "drizzle-orm";
import { bootServer } from "@/lib/server";
import { getDb } from "@/lib/db";
import { searches } from "@/lib/db/schema";
import { enqueueJob } from "@/lib/jobs/queue";
import { getConfiguredSearchSources } from "@/lib/discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  const db = getDb();
  const rows = db.select().from(searches).orderBy(desc(searches.createdAt)).all();
  const configured = getConfiguredSearchSources().map((s) => s.id);
  return NextResponse.json({ searches: rows, configuredSources: configured });
}

export async function POST(req: Request) {
  bootServer();
  const body = await req.json();
  const niche = String(body.niche || "").trim();
  if (!niche && !body.manualText) {
    return NextResponse.json({ error: "Niche or manual domain list required" }, { status: 400 });
  }

  const db = getDb();
  const id = uuid();
  const now = Date.now();
  const sources = (body.sources as string[]) || ["manual"];
  const keywords = (body.keywords as string[]) || [];
  const targetCount = Number(body.targetCount || 50);

  db.insert(searches)
    .values({
      id,
      niche: niche || "manual import",
      keywords: JSON.stringify(keywords),
      sources: JSON.stringify(sources),
      targetCount,
      status: "pending",
      stats: JSON.stringify({}),
      createdAt: now,
    })
    .run();

  const jobId = enqueueJob({
    type: "discover",
    searchId: id,
    payload: {
      searchId: id,
      niche: niche || "manual import",
      keywords,
      sources,
      targetCount,
      manualText: body.manualText || "",
      usOnly: Boolean(body.usOnly ?? true),
      priceBandMin: body.priceBandMin,
      priceBandMax: body.priceBandMax,
      excludeKeywords: body.excludeKeywords || [],
    },
  });

  return NextResponse.json({ searchId: id, jobId });
}
