import { NextResponse } from "next/server";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { bootServer } from "@/lib/server";
import { getDb } from "@/lib/db";
import { leads, contacts } from "@/lib/db/schema";
import { enqueueJob } from "@/lib/jobs/queue";
import { safeJsonParse } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  bootServer();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const tier = url.searchParams.get("tier") || "";
  const status = url.searchParams.get("status") || "";
  const niche = url.searchParams.get("niche") || "";

  const db = getDb();
  let rows = db.select().from(leads).orderBy(desc(leads.score)).all();

  if (q) {
    const lower = q.toLowerCase();
    rows = rows.filter(
      (l) =>
        l.domain.includes(lower) ||
        (l.companyName || "").toLowerCase().includes(lower) ||
        (l.niche || "").toLowerCase().includes(lower)
    );
  }
  if (tier) rows = rows.filter((l) => l.tier === tier);
  if (status) rows = rows.filter((l) => l.pipelineStatus === status);
  if (niche) rows = rows.filter((l) => (l.niche || "").toLowerCase().includes(niche.toLowerCase()));

  const enriched = rows.map((l) => {
    const cs = db.select().from(contacts).where(eq(contacts.leadId, l.id)).all();
    const email = cs.filter((c) => c.kind === "email").sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
    const phone = cs.find((c) => c.kind === "phone");
    const owner = cs.find((c) => c.kind === "owner");
    return {
      ...l,
      tags: safeJsonParse(l.tags, []),
      categories: safeJsonParse(l.categories, []),
      scoreBreakdown: safeJsonParse(l.scoreBreakdown, {}),
      bestEmail: email?.value || null,
      phone: phone?.value || null,
      ownerName: owner?.personName || null,
    };
  });

  return NextResponse.json({ leads: enriched });
}

export async function PATCH(req: Request) {
  bootServer();
  const body = await req.json();
  const ids: string[] = body.ids || (body.id ? [body.id] : []);
  if (!ids.length) return NextResponse.json({ error: "No ids" }, { status: 400 });

  const db = getDb();
  for (const id of ids) {
    const patch: Record<string, unknown> = {};
    if (body.pipelineStatus) patch.pipelineStatus = body.pipelineStatus;
    if (typeof body.doNotContact === "boolean") patch.doNotContact = body.doNotContact;
    if (body.notes != null) patch.notes = body.notes;
    if (body.tags) patch.tags = JSON.stringify(body.tags);
    if (Object.keys(patch).length) {
      db.update(leads).set(patch).where(eq(leads.id, id)).run();
    }
    if (body.action === "recrawl") {
      const lead = db.select().from(leads).where(eq(leads.id, id)).get();
      if (lead) {
        enqueueJob({
          type: "crawl",
          leadId: id,
          payload: { domain: lead.domain, niche: lead.niche, searchId: lead.searchId },
        });
      }
    }
    if (body.action === "similar") {
      enqueueJob({ type: "similar", leadId: id, payload: { leadId: id, targetCount: 20 } });
    }
  }

  return NextResponse.json({ ok: true });
}

// silence unused import warnings in some bundlers
void like;
void or;
void sql;
