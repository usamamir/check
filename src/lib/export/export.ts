import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leads, contacts } from "@/lib/db/schema";
import { safeJsonParse } from "@/lib/utils";

export type ExportLeadRow = {
  company: string;
  domain: string;
  score: number;
  tier: string;
  dropshipStatus: string;
  niche: string;
  state: string;
  platform: string;
  productCount: number | string;
  priceMin: number | string;
  priceMedian: number | string;
  priceMax: number | string;
  bestEmail: string;
  phone: string;
  owner: string;
  pipelineStatus: string;
  doNotContact: string;
  tags: string;
};

function leadRows(ids?: string[]): ExportLeadRow[] {
  const db = getDb();
  const all = db.select().from(leads).all();
  const filtered = ids?.length ? all.filter((l) => ids.includes(l.id)) : all;
  const rows: ExportLeadRow[] = [];

  for (const lead of filtered) {
    if (lead.doNotContact) continue;
    const cs = db.select().from(contacts).where(eq(contacts.leadId, lead.id)).all();
    const emails = cs.filter((c) => c.kind === "email").sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    const phones = cs.filter((c) => c.kind === "phone");
    const owner = cs.find((c) => c.kind === "owner");
    rows.push({
      company: lead.companyName || "",
      domain: lead.domain,
      score: lead.score ?? 0,
      tier: lead.tier || "D",
      dropshipStatus: lead.dropshipStatus || "unknown",
      niche: lead.niche || "",
      state: lead.state || "",
      platform: lead.platform || "",
      productCount: lead.productCount ?? "",
      priceMin: lead.priceMin ?? "",
      priceMedian: lead.priceMedian ?? "",
      priceMax: lead.priceMax ?? "",
      bestEmail: emails[0]?.value || "",
      phone: phones[0]?.value || "",
      owner: owner?.personName || "",
      pipelineStatus: lead.pipelineStatus || "new",
      doNotContact: lead.doNotContact ? "yes" : "no",
      tags: safeJsonParse<string[]>(lead.tags, []).join("; "),
    });
  }
  return rows;
}

export function exportCsv(ids?: string[]): string {
  const rows = leadRows(ids);
  const headers = Object.keys(rows[0] || {
    company: "",
    domain: "",
    score: "",
    tier: "",
    dropshipStatus: "",
    niche: "",
    state: "",
    platform: "",
    productCount: "",
    priceMin: "",
    priceMedian: "",
    priceMax: "",
    bestEmail: "",
    phone: "",
    owner: "",
    pipelineStatus: "",
    doNotContact: "",
    tags: "",
  });
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(","))].join("\n");
}

export async function exportXlsx(ids?: string[]): Promise<Buffer> {
  const rows = leadRows(ids);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Leads");
  if (!rows.length) {
    ws.addRow(["No exportable leads (do-not-contact leads are excluded)"]);
  } else {
    ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k, width: 18 }));
    for (const row of rows) ws.addRow(row);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
