import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { bootServer } from "@/lib/server";
import { getDb } from "@/lib/db";
import { leads, evidence, contacts, products, activities, pages } from "@/lib/db/schema";
import { safeJsonParse } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  bootServer();
  const db = getDb();
  const lead = db.select().from(leads).where(eq(leads.id, params.id)).get();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    lead: {
      ...lead,
      tags: safeJsonParse(lead.tags, []),
      categories: safeJsonParse(lead.categories, []),
      scoreBreakdown: safeJsonParse(lead.scoreBreakdown, {}),
      requirements: safeJsonParse(lead.requirements, {}),
    },
    evidence: db.select().from(evidence).where(eq(evidence.leadId, params.id)).all(),
    contacts: db.select().from(contacts).where(eq(contacts.leadId, params.id)).all(),
    products: db.select().from(products).where(eq(products.leadId, params.id)).all(),
    activities: db
      .select()
      .from(activities)
      .where(eq(activities.leadId, params.id))
      .orderBy(desc(activities.createdAt))
      .all(),
    pages: db.select().from(pages).where(eq(pages.leadId, params.id)).all(),
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  bootServer();
  const body = await req.json();
  const db = getDb();
  const lead = db.select().from(leads).where(eq(leads.id, params.id)).get();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (body.pipelineStatus && body.pipelineStatus !== lead.pipelineStatus) {
    patch.pipelineStatus = body.pipelineStatus;
    db.insert(activities)
      .values({
        id: uuid(),
        leadId: params.id,
        type: "status_change",
        body: `Moved to ${body.pipelineStatus}`,
        createdAt: Date.now(),
      })
      .run();
  }
  if (body.notes != null) patch.notes = body.notes;
  if (typeof body.doNotContact === "boolean") patch.doNotContact = body.doNotContact;
  if (body.tags) patch.tags = JSON.stringify(body.tags);

  if (Object.keys(patch).length) {
    db.update(leads).set(patch).where(eq(leads.id, params.id)).run();
  }
  return NextResponse.json({ ok: true });
}
