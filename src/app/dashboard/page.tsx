"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/shared/tier-badge";
import { EmptyState } from "@/components/shared/empty-state";

type DashboardData = {
  totalLeads: number;
  byTier: Record<string, number>;
  byStatus: Record<string, number>;
  byNiche: Record<string, number>;
  hot: Array<{ id: string; companyName?: string; domain: string; score?: number; tier?: string; niche?: string }>;
  runningJobs: number;
  followups: Array<{ id: string; companyName?: string; domain: string }>;
  funnel: Array<{ stage: string; count: number }>;
  emailsSentToday: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-muted" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-lg bg-muted" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">US dropship supplier pipeline at a glance</p>
        </div>
        <Button asChild>
          <Link href="/search">New search</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total leads</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{data.totalLeads}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">A-tier</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-emerald-600">{data.byTier.A || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Jobs running</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{data.runningJobs}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Emails today</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{data.emailsSentToday}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Outreach funnel</CardTitle></CardHeader>
          <CardContent className="h-64">
            {data.totalLeads === 0 ? (
              <EmptyState title="No leads yet" description="Start a niche search or import domains to populate the funnel." action={<Button asChild size="sm"><Link href="/search">Start search</Link></Button>} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By tier</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(["A", "B", "C", "D"] as const).map((t) => (
              <div key={t} className="flex items-center justify-between rounded-md border px-3 py-2">
                <TierBadge tier={t} />
                <span className="font-mono text-sm">{data.byTier[t] || 0}</span>
              </div>
            ))}
            <div className="pt-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Niches</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.byNiche).slice(0, 12).map(([n, c]) => (
                  <Badge key={n} variant="outline">{n} · {c}</Badge>
                ))}
                {!Object.keys(data.byNiche).length && <span className="text-sm text-muted-foreground">—</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Hot leads (A-tier)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.hot.length === 0 && <p className="text-sm text-muted-foreground">No A-tier leads yet.</p>}
            {data.hot.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50">
                <div>
                  <div className="text-sm font-medium">{l.companyName || l.domain}</div>
                  <div className="text-xs text-muted-foreground">{l.domain}{l.niche ? ` · ${l.niche}` : ""}</div>
                </div>
                <TierBadge tier={l.tier} score={l.score} />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Follow up today</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.followups.length === 0 && <p className="text-sm text-muted-foreground">No contacted leads overdue for follow-up.</p>}
            {data.followups.map((l) => (
              <Link key={l.id} href={`/outreach?lead=${l.id}`} className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50">
                <div className="text-sm font-medium">{l.companyName || l.domain}</div>
                <Badge variant="warning">Follow up</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
