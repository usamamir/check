import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { bootServer } from "@/lib/server";
import { getDb } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import { PIPELINE_STATUSES } from "@/lib/db/defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  const db = getDb();
  const all = db.select().from(leads).all();
  const columns = Object.fromEntries(
    PIPELINE_STATUSES.map((s) => [s, all.filter((l) => (l.pipelineStatus || "new") === s)])
  );
  return NextResponse.json({ columns });
}

export async function PATCH(req: Request) {
  bootServer();
  const body = await req.json();
  const { id, pipelineStatus } = body as { id: string; pipelineStatus: string };
  if (!id || !PIPELINE_STATUSES.includes(pipelineStatus as (typeof PIPELINE_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const db = getDb();
  const lead = db.select().from(leads).where(eq(leads.id, id)).get();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.update(leads).set({ pipelineStatus }).where(eq(leads.id, id)).run();
  db.insert(activities)
    .values({
      id: uuid(),
      leadId: id,
      type: "status_change",
      body: `Pipeline: ${lead.pipelineStatus} → ${pipelineStatus}`,
      createdAt: Date.now(),
    })
    .run();
  return NextResponse.json({ ok: true });
}
