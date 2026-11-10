"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Job = {
  id: string;
  type: string;
  status?: string | null;
  attempts?: number | null;
  error?: string | null;
  progress?: string | null;
  createdAt: number;
  updatedAt: number;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  async function load() {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(data.jobs || []);
  }

  useEffect(() => {
    void load();
    const es = new EventSource("/api/sse");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.message) setLogs((prev) => [...prev.slice(-150), data.message]);
        if (data.type === "status" || data.type === "job") void load();
      } catch {
        // ignore
      }
    };
    const t = setInterval(() => void load(), 5000);
    return () => {
      es.close();
      clearInterval(t);
    };
  }, []);

  async function control(id: string, action: "pause" | "resume" | "cancel") {
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    toast.message(`${action} sent`);
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          SQLite-backed queue. Interrupted jobs resume as pending after restart.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Queue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {jobs.length === 0 && <p className="text-sm text-muted-foreground">No jobs yet.</p>}
            {jobs.map((j) => {
              let progressMsg = "";
              try {
                progressMsg = JSON.parse(j.progress || "{}").message || "";
              } catch {
                progressMsg = "";
              }
              return (
                <div key={j.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{j.type}</div>
                    <Badge
                      variant={
                        j.status === "completed"
                          ? "success"
                          : j.status === "failed"
                            ? "danger"
                            : j.status === "running"
                              ? "warning"
                              : "outline"
                      }
                    >
                      {j.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    attempts {j.attempts ?? 0} · {new Date(j.createdAt).toLocaleString()}
                  </div>
                  {progressMsg && <div className="mt-1 text-xs">{progressMsg}</div>}
                  {j.error && <div className="mt-1 text-xs text-red-600">{j.error}</div>}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => control(j.id, "pause")}>Pause</Button>
                    <Button size="sm" variant="outline" onClick={() => control(j.id, "resume")}>Resume</Button>
                    <Button size="sm" variant="destructive" onClick={() => control(j.id, "cancel")}>Cancel</Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Live log</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[520px] overflow-auto rounded-md border bg-muted/20 p-3 font-mono text-xs">
              {logs.map((l, i) => (
                <div key={i} className="border-b border-border/40 py-1">{l}</div>
              ))}
              {!logs.length && <div className="text-muted-foreground">Waiting for events…</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
