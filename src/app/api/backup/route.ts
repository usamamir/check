import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { bootServer } from "@/lib/server";
import { getSqlite } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  // checkpoint WAL so the file is consistent enough for download
  try {
    getSqlite().pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    // ignore
  }
  const dbFile = path.join(process.cwd(), "data", "supplyscout.db");
  if (!fs.existsSync(dbFile)) {
    return NextResponse.json({ error: "Database not found" }, { status: 404 });
  }
  const buf = fs.readFileSync(dbFile);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="supplyscout-backup.db"',
    },
  });
}

export async function POST(req: Request) {
  bootServer();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const dbFile = path.join(process.cwd(), "data", "supplyscout.db");
  const bak = path.join(process.cwd(), "data", `supplyscout.db.bak-${Date.now()}`);
  if (fs.existsSync(dbFile)) fs.copyFileSync(dbFile, bak);
  // close isn't straightforward with singleton; write and ask restart
  fs.writeFileSync(dbFile, buf);
  return NextResponse.json({
    ok: true,
    message: "Database restored. Restart the app (npm run dev) to reload the connection.",
  });
}
