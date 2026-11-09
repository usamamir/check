import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { bootServer } from "@/lib/server";
import { getDb } from "@/lib/db";
import { leads, jobs, emails } from "@/lib/db/schema";
import { getSetting } from "@/lib/db/settings";
import { getEmailsSentToday } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  const db = getDb();
  const all = db.select().from(leads).all();

  const byTier: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  const byStatus: Record<string, number> = {};
  const byNiche: Record<string, number> = {};

  for (const l of all) {
    byTier[l.tier || "D"] = (byTier[l.tier || "D"] || 0) + 1;
    byStatus[l.pipelineStatus || "new"] = (byStatus[l.pipelineStatus || "new"] || 0) + 1;
    const niche = l.niche || "unknown";
    byNiche[niche] = (byNiche[niche] || 0) + 1;
  }

  const hot = db.select().from(leads).where(eq(leads.tier, "A")).orderBy(desc(leads.score)).all().slice(0, 8);
  const runningJobs = db
    .select()
    .from(jobs)
    .all()
    .filter((j) => ["running", "pending", "resumed"].includes(j.status || ""));

  const followupDays = parseInt(getSetting("followup_days", "5"), 10) || 5;
  const cutoff = Date.now() - followupDays * 24 * 3600 * 1000;
  const followups = all.filter((l) => {
    if (l.pipelineStatus !== "contacted" || l.doNotContact) return false;
    // approximate: last activity not tracked precisely — use lastCrawled/firstSeen
    const t = l.lastCrawledAt || l.firstSeenAt;
    return t <= cutoff;
  });

  const funnel = [
    { stage: "New", count: byStatus.new || 0 },
    { stage: "Researching", count: byStatus.researching || 0 },
    { stage: "Contacted", count: byStatus.contacted || 0 },
    { stage: "Replied", count: byStatus.replied || 0 },
    { stage: "Negotiating", count: byStatus.negotiating || 0 },
    { stage: "Approved", count: byStatus.approved || 0 },
    { stage: "Listing Live", count: byStatus.listing_live || 0 },
  ];

  const sentEmails = db.select().from(emails).where(eq(emails.status, "sent")).all().length;

  return NextResponse.json({
    totalLeads: all.length,
    byTier,
    byStatus,
    byNiche,
    hot,
    runningJobs: runningJobs.length,
    followups: followups.slice(0, 20),
    funnel,
    emailsSentToday: getEmailsSentToday(),
    emailsSentTotal: sentEmails,
  });
}
