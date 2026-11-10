"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

type LogLine = { ts: number; message: string; jobId?: string };

export default function SearchPage() {
  const [niche, setNiche] = useState("");
  const [keywords, setKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [targetCount, setTargetCount] = useState(50);
  const [manualText, setManualText] = useState("");
  const [usOnly, setUsOnly] = useState(true);
  const [priceMin, setPriceMin] = useState(5);
  const [priceMax, setPriceMax] = useState(500);
  const [sources, setSources] = useState<string[]>(["manual"]);
  const [configured, setConfigured] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/searches")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configuredSources || []);
        if ((d.configuredSources || []).length) {
          setSources((prev) => Array.from(new Set([...prev, ...d.configuredSources])));
        }
      });
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/sse");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.message) {
          setLogs((prev) => [...prev.slice(-200), { ts: data.ts || Date.now(), message: data.message, jobId: data.jobId }]);
        }
        if (data.data?.discovered != null) {
          setProgress(Math.min(95, Number(data.data.discovered)));
        }
        if (data.message?.includes("complete") || data.data?.status === "completed") {
          setProgress(100);
          setBusy(false);
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, []);

  function toggleSource(id: string, on: boolean) {
    setSources((prev) => (on ? Array.from(new Set([...prev, id])) : prev.filter((s) => s !== id)));
  }

  async function startSearch() {
    if (!niche.trim() && !manualText.trim()) {
      toast.error("Enter a niche or paste domains");
      return;
    }
    setBusy(true);
    setProgress(5);
    setLogs([]);
    const res = await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        niche,
        keywords: keywords.split(",").map((s) => s.trim()).filter(Boolean),
        excludeKeywords: excludeKeywords.split(",").map((s) => s.trim()).filter(Boolean),
        targetCount,
        sources,
        manualText,
        usOnly,
        priceBandMin: priceMin,
        priceBandMax: priceMax,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to start search");
      setBusy(false);
      return;
    }
    setActiveJobId(data.jobId);
    toast.success("Discovery job started");
  }

  async function control(action: "pause" | "resume" | "cancel") {
    if (!activeJobId) return;
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id: activeJobId }),
    });
    toast.message(`Job ${action} requested`);
    if (action === "cancel") setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New search</h1>
        <p className="text-sm text-muted-foreground">
          Discover candidate US suppliers by niche, or import domains with zero API keys.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search setup</CardTitle>
            <CardDescription>Manual import always works. Search APIs are optional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Niche</Label>
              <Input id="niche" placeholder='e.g. "pet supplies"' value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sub-keywords</Label>
                <Input placeholder="organic, toys" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Exclude keywords</Label>
                <Input placeholder="cheap, replica" value={excludeKeywords} onChange={(e) => setExcludeKeywords(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Target domains</Label>
                <Input type="number" value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Price min</Label>
                <Input type="number" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Price max</Label>
                <Input type="number" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="text-sm font-medium">US-only preference</div>
                <div className="text-xs text-muted-foreground">Boost / require US signals during scoring</div>
              </div>
              <Switch checked={usOnly} onCheckedChange={setUsOnly} />
            </div>

            <div className="space-y-2">
              <Label>Discovery sources</Label>
              <div className="space-y-2 rounded-md border p-3">
                {[
                  { id: "manual", label: "Manual import", always: true },
                  { id: "brave", label: "Brave Search API", always: false },
                  { id: "serpapi", label: "SerpAPI", always: false },
                  { id: "google_cse", label: "Google CSE", always: false },
                ].map((s) => {
                  const ready = s.always || configured.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={sources.includes(s.id)}
                        disabled={!ready}
                        onCheckedChange={(v) => toggleSource(s.id, Boolean(v))}
                      />
                      <span>{s.label}</span>
                      {!ready && <span className="text-xs text-amber-600">not configured</span>}
                    </label>
                  );
                })}
                {!configured.length && (
                  <p className="text-xs text-muted-foreground">
                    No search API keys found. Paste domains below, or add keys in Settings. We never scrape Google/Bing results pages.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Manual domains / URLs (CSV or one per line)</Label>
              <Textarea
                rows={6}
                placeholder={"examplebrand.com\nhttps://anotherusa.co/wholesale"}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={startSearch} disabled={busy}>
                {busy ? "Running…" : "Start discovery"}
              </Button>
              <Button variant="outline" disabled={!activeJobId} onClick={() => control("pause")}>Pause</Button>
              <Button variant="outline" disabled={!activeJobId} onClick={() => control("resume")}>Resume</Button>
              <Button variant="destructive" disabled={!activeJobId} onClick={() => control("cancel")}>Cancel</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live job view</CardTitle>
            <CardDescription>Domains discovered → crawled → scored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <div className="h-[420px] overflow-auto rounded-md border bg-muted/20 p-3 font-mono text-xs leading-relaxed">
              {logs.length === 0 && <div className="text-muted-foreground">Waiting for job events…</div>}
              {logs.map((l, i) => (
                <div key={`${l.ts}-${i}`} className="border-b border-border/40 py-1">
                  <span className="text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</span>{" "}
                  {l.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
