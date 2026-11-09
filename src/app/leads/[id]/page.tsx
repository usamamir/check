"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TierBadge } from "@/components/shared/tier-badge";
import { PIPELINE_LABELS, type PipelineStatus } from "@/lib/db/defaults";

type Detail = {
  lead: Record<string, unknown> & {
    id: string;
    domain: string;
    companyName?: string;
    score?: number;
    tier?: string;
    scoreBreakdown?: Record<string, number>;
    dropshipStatus?: string;
    description?: string;
    platform?: string;
    city?: string;
    state?: string;
    niche?: string;
    productCount?: number;
    priceMin?: number;
    priceMedian?: number;
    priceMax?: number;
    domainAgeYears?: number;
    pipelineStatus?: string;
    notes?: string;
    doNotContact?: boolean;
    crawlError?: string;
    requirements?: Record<string, unknown>;
  };
  evidence: Array<{ id: string; type: string; phrase: string; snippet?: string; url?: string }>;
  contacts: Array<{
    id: string;
    kind: string;
    value: string;
    label?: string;
    personName?: string;
    personRole?: string;
    mxValid?: boolean;
    sourceUrl?: string;
  }>;
  products: Array<{ id: string; title: string; price?: number; url?: string; image?: string; vendor?: string }>;
  activities: Array<{ id: string; type: string; body: string; createdAt: number }>;
};

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);

  async function load() {
    const res = await fetch(`/api/leads/${params.id}`);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function saveNotes(notes: string) {
    await fetch(`/api/leads/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    toast.success("Notes saved");
  }

  async function setStatus(pipelineStatus: string) {
    await fetch(`/api/leads/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStatus }),
    });
    void load();
  }

  async function recrawl() {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [params.id], action: "recrawl" }),
    });
    toast.success("Re-crawl queued");
  }

  async function similar() {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [params.id], action: "similar" }),
    });
    toast.success("Similar expansion queued");
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  if (!data) return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  const { lead } = data;
  const breakdown = lead.scoreBreakdown || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/leads" className="text-sm text-muted-foreground hover:underline">← Leads</Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{lead.companyName || lead.domain}</h1>
          <a
            href={`https://${lead.domain}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            {lead.domain} <ExternalLink className="h-3 w-3" />
          </a>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TierBadge tier={lead.tier} score={lead.score} />
            <Badge variant="outline">{lead.dropshipStatus}</Badge>
            <Badge variant="secondary">{lead.platform || "unknown platform"}</Badge>
            {(lead.city || lead.state) && (
              <Badge variant="outline">{[lead.city, lead.state].filter(Boolean).join(", ")}</Badge>
            )}
            {lead.doNotContact && <Badge variant="danger">Do not contact</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={recrawl}><RefreshCw className="h-4 w-4" /> Re-crawl</Button>
          <Button variant="outline" onClick={similar}>Find similar</Button>
          <Button asChild><Link href={`/outreach?lead=${lead.id}`}>Outreach</Link></Button>
        </div>
      </div>

      {lead.crawlError && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Crawl note: {lead.crawlError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Score breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(breakdown)
              .filter(([k]) => !["total", "tier", "components"].includes(k))
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</span>
                  <span className="font-mono">{typeof v === "number" ? v : String(v)}</span>
                </div>
              ))}
            {lead.description && <p className="pt-3 text-sm text-muted-foreground">{lead.description}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={lead.pipelineStatus || "new"}
              onChange={(e) => void setStatus(e.target.value)}
            >
              {Object.entries(PIPELINE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground">
              Niche: {lead.niche || "—"} · Products: {lead.productCount ?? "—"}
              {lead.priceMedian != null ? ` · median $${lead.priceMedian}` : ""}
              {lead.domainAgeYears != null ? ` · domain ${lead.domainAgeYears}y` : ""}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(lead.doNotContact)}
                onChange={async (e) => {
                  await fetch(`/api/leads/${lead.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ doNotContact: e.target.checked }),
                  });
                  void load();
                }}
              />
              Do not contact
            </label>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Dropship evidence</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.evidence.length === 0 && <p className="text-sm text-muted-foreground">No signals found.</p>}
            {data.evidence.map((e) => (
              <div key={e.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant={e.type === "positive" ? "success" : e.type === "negative" ? "danger" : "warning"}>
                    {e.type}
                  </Badge>
                  <span className="font-medium">{e.phrase}</span>
                </div>
                <p className="text-muted-foreground">{e.snippet}</p>
                {e.url && (
                  <a href={e.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs hover:underline">
                    source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contacts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.contacts.length === 0 && <p className="text-sm text-muted-foreground">No contacts extracted.</p>}
            {data.contacts.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">
                    {c.kind === "owner" ? `${c.personName} · ${c.personRole}` : c.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.kind}{c.label ? ` · ${c.label}` : ""}
                    {c.kind === "email" && c.mxValid != null ? (c.mxValid ? " · MX valid" : " · MX fail") : ""}
                  </div>
                  {c.sourceUrl && (
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="text-xs hover:underline">
                      source
                    </a>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => copy(c.value)}><Copy className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Catalog snapshot</CardTitle></CardHeader>
        <CardContent>
          {data.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No product samples (Shopify /products.json when available).</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.products.map((p) => (
                <a key={p.id} href={p.url || "#"} target="_blank" rel="noreferrer" className="rounded-md border p-2 hover:bg-muted/40">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="mb-2 h-28 w-full rounded object-cover" />
                  ) : (
                    <div className="mb-2 h-28 rounded bg-muted" />
                  )}
                  <div className="line-clamp-2 text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.price != null ? `$${p.price}` : ""}{p.vendor ? ` · ${p.vendor}` : ""}
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              defaultValue={lead.notes || ""}
              rows={5}
              onBlur={(e) => void saveNotes(e.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.activities.map((a) => (
              <div key={a.id} className="border-b border-border/60 py-2 text-sm last:border-0">
                <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()} · {a.type}</div>
                <div>{a.body}</div>
              </div>
            ))}
            {!data.activities.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </CardContent>
        </Card>
      </div>

      {lead.requirements && Object.keys(lead.requirements).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(lead.requirements, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* silence unused */}
      <span className="hidden">{PIPELINE_LABELS[(lead.pipelineStatus as PipelineStatus) || "new"]}</span>
    </div>
  );
}
