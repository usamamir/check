import { NextResponse } from "next/server";
import { bootServer } from "@/lib/server";
import { listJobs, enqueueJob, pauseJob, resumeJob, cancelJob } from "@/lib/jobs/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  bootServer();
  return NextResponse.json({ jobs: listJobs(200) });
}

export async function POST(req: Request) {
  bootServer();
  const body = await req.json();
  const action = body.action as string;

  if (action === "enqueue") {
    const id = enqueueJob({
      type: body.type,
      payload: body.payload || {},
      searchId: body.searchId,
      leadId: body.leadId,
    });
    return NextResponse.json({ id });
  }
  if (action === "pause" && body.id) {
    pauseJob(body.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "resume" && body.id) {
    resumeJob(body.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "cancel" && body.id) {
    cancelJob(body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
