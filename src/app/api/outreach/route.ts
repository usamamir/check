import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { bootServer } from "@/lib/server";
import { getDb } from "@/lib/db";
import { leads, contacts, products, templates, emails, activities } from "@/lib/db/schema";
import { buildTemplateVars, renderTemplate } from "@/lib/email/templates";
import { sendViaSmtp, canSendEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  const db = getDb();
  const drafts = db.select().from(emails).orderBy(desc(emails.createdAt)).all().slice(0, 100);
  const gate = canSendEmail();
  return NextResponse.json({ emails: drafts, sendGate: gate });
}

export async function POST(req: Request) {
  bootServer();
  const body = await req.json();
  const db = getDb();
  const action = body.action as string;

  if (action === "draft") {
    const lead = db.select().from(leads).where(eq(leads.id, body.leadId)).get();
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.doNotContact) {
      return NextResponse.json({ error: "Lead is marked Do Not Contact" }, { status: 400 });
    }
    const tpl = db.select().from(templates).where(eq(templates.id, body.templateId)).get();
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const cs = db.select().from(contacts).where(eq(contacts.leadId, lead.id)).all();
    const ps = db.select().from(products).where(eq(products.leadId, lead.id)).all();
    const vars = buildTemplateVars({ lead, contacts: cs, products: ps });
    const subject = renderTemplate(tpl.subject, vars);
    const emailBody = renderTemplate(tpl.body, vars);
    const to =
      body.to ||
      cs.filter((c) => c.kind === "email").sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0]
        ?.value ||
      "";

    const id = uuid();
    db.insert(emails)
      .values({
        id,
        leadId: lead.id,
        templateId: tpl.id,
        to,
        subject,
        body: emailBody,
        status: "draft",
        createdAt: Date.now(),
      })
      .run();

    return NextResponse.json({ id, to, subject, body: emailBody, mailto: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}` });
  }

  if (action === "send") {
    const draft = db.select().from(emails).where(eq(emails.id, body.emailId)).get();
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    const lead = db.select().from(leads).where(eq(leads.id, draft.leadId)).get();
    if (lead?.doNotContact) {
      return NextResponse.json({ error: "Lead is marked Do Not Contact" }, { status: 400 });
    }
    const result = await sendViaSmtp({ to: draft.to, subject: draft.subject, body: draft.body });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    db.update(emails)
      .set({ status: "sent", sentAt: Date.now() })
      .where(eq(emails.id, draft.id))
      .run();
    if (lead) {
      db.update(leads).set({ pipelineStatus: "contacted" }).where(eq(leads.id, lead.id)).run();
      db.insert(activities)
        .values({
          id: uuid(),
          leadId: lead.id,
          type: "email_sent",
          body: `Sent: ${draft.subject}`,
          createdAt: Date.now(),
        })
        .run();
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
