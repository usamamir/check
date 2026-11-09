import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { bootServer } from "@/lib/server";
import { getDb } from "@/lib/db";
import { templates } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  const db = getDb();
  return NextResponse.json({ templates: db.select().from(templates).all() });
}

export async function PUT(req: Request) {
  bootServer();
  const body = await req.json();
  const db = getDb();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  db.update(templates)
    .set({
      name: body.name,
      subject: body.subject,
      body: body.body,
      kind: body.kind,
    })
    .where(eq(templates.id, body.id))
    .run();
  return NextResponse.json({ ok: true });
}
