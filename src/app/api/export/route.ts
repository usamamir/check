import { NextResponse } from "next/server";
import { bootServer } from "@/lib/server";
import { exportCsv, exportXlsx } from "@/lib/export/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  bootServer();
  const body = await req.json().catch(() => ({}));
  const format = (body.format as string) || "csv";
  const ids = body.ids as string[] | undefined;

  if (format === "xlsx") {
    const buf = await exportXlsx(ids);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="supplyscout-leads.xlsx"',
      },
    });
  }

  const csv = exportCsv(ids);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="supplyscout-leads.csv"',
    },
  });
}
