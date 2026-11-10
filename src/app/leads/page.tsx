"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/shared/tier-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PIPELINE_LABELS, type PipelineStatus } from "@/lib/db/defaults";

type LeadRow = {
  id: string;
  domain: string;
  companyName?: string | null;
  score?: number | null;
  tier?: string | null;
  niche?: string | null;
  dropshipStatus?: string | null;
  state?: string | null;
  platform?: string | null;
  productCount?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  bestEmail?: string | null;
  phone?: string | null;
  ownerName?: string | null;
  pipelineStatus?: string | null;
  doNotContact?: boolean | null;
  lastCrawledAt?: number | null;
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "score", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tier) params.set("tier", tier);
    if (status) params.set("status", status);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setLoading(false);
  }, [q, tier, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<LeadRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(Boolean(v))} />
        ),
        size: 32,
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => <TierBadge tier={row.original.tier} score={row.original.score} />,
      },
      {
        id: "company",
        header: "Company",
        accessorFn: (r) => r.companyName || r.domain,
        cell: ({ row }) => (
          <div>
            <Link href={`/leads/${row.original.id}`} className="font-medium hover:underline">
              {row.original.companyName || row.original.domain}
            </Link>
            <div className="text-xs text-muted-foreground">{row.original.domain}</div>
          </div>
        ),
      },
      { accessorKey: "niche", header: "Niche", cell: ({ getValue }) => getValue() || "—" },
      { accessorKey: "dropshipStatus", header: "Dropship" },
      { accessorKey: "state", header: "State", cell: ({ getValue }) => getValue() || "—" },
      { accessorKey: "platform", header: "Platform", cell: ({ getValue }) => getValue() || "—" },
      {
        accessorKey: "productCount",
        header: "Products",
        cell: ({ row }) => {
          const n = row.original.productCount;
          const min = row.original.priceMin;
          const max = row.original.priceMax;
          return (
            <div className="text-xs">
              <div>{n ?? "—"}</div>
              {min != null && max != null ? (
                <div className="text-muted-foreground">
                  ${min}–${max}
                </div>
              ) : null}
            </div>
          );
        },
      },
      { accessorKey: "bestEmail", header: "Email", cell: ({ getValue }) => (getValue() as string) || "—" },
      { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => (getValue() as string) || "—" },
      { accessorKey: "ownerName", header: "Owner", cell: ({ getValue }) => (getValue() as string) || "—" },
      {
        accessorKey: "pipelineStatus",
        header: "Status",
        cell: ({ getValue }) => {
          const s = (getValue() as PipelineStatus) || "new";
          return <Badge variant="outline">{PIPELINE_LABELS[s] || s}</Badge>;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r.id,
    enableRowSelection: true,
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const rows = table.getRowModel().rows;
      if (!rows.length) return;
      if (e.key === "j") {
        e.preventDefault();
        setCursor((c) => Math.min(rows.length - 1, c + 1));
      } else if (e.key === "k") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const id = rows[cursor]?.original.id;
        if (id) router.push(`/leads/${id}`);
      } else if (e.key === "s") {
        e.preventDefault();
        const id = rows[cursor]?.original.id;
        if (!id) return;
        const next = prompt("New status (new, researching, contacted, replied, negotiating, approved, listing_live, rejected)");
        if (!next) return;
        void fetch("/api/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id], pipelineStatus: next }),
        }).then(() => load());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [table, cursor, router, load]);

  async function bulk(action: string, extra: Record<string, unknown> = {}) {
    if (!selectedIds.length) {
      toast.error("Select leads first");
      return;
    }
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, action, ...extra }),
    });
    toast.success("Updated");
    setRowSelection({});
    void load();
  }

  async function exportSelected(format: "csv" | "xlsx") {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, ids: selectedIds.length ? selectedIds : undefined }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supplyscout-leads.${format === "xlsx" ? "xlsx" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Shortcuts: <kbd className="rounded border px-1">j</kbd>/<kbd className="rounded border px-1">k</kbd> move ·{" "}
            <kbd className="rounded border px-1">Enter</kbd> open · <kbd className="rounded border px-1">s</kbd> status
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportSelected("csv")}>Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportSelected("xlsx")}>Export Excel</Button>
          <Button variant="outline" size="sm" onClick={() => bulk("recrawl")}>Re-crawl</Button>
          <Button variant="outline" size="sm" onClick={() => bulk("", { doNotContact: true })}>Do not contact</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = prompt("Pipeline status for selected?");
              if (next) void bulk("", { pipelineStatus: next });
            }}
          >
            Set status
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Filter company/domain/niche" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">All tiers</option>
          {["A", "B", "C", "D"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(PIPELINE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Run a niche search or import a domain list to start building your supplier pipeline."
          action={<Button asChild size="sm"><Link href="/search">New search</Link></Button>}
        />
      ) : (
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="cursor-pointer whitespace-nowrap px-3 py-2 font-medium"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-t hover:bg-muted/40 ${i === cursor ? "bg-muted/60" : ""}`}
                  onClick={() => setCursor(i)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
