"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { TierBadge } from "@/components/shared/tier-badge";
import { PIPELINE_LABELS, PIPELINE_STATUSES, type PipelineStatus } from "@/lib/db/defaults";
import { cn } from "@/lib/utils";

type LeadCard = {
  id: string;
  domain: string;
  companyName?: string | null;
  score?: number | null;
  tier?: string | null;
  niche?: string | null;
};

function CardItem({ lead }: { lead: LeadCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-70"
      )}
    >
      <Link href={`/leads/${lead.id}`} className="text-sm font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
        {lead.companyName || lead.domain}
      </Link>
      <div className="mt-1 text-xs text-muted-foreground">{lead.domain}</div>
      <div className="mt-2 flex items-center justify-between">
        <TierBadge tier={lead.tier} score={lead.score} />
        {lead.niche && <span className="text-[10px] text-muted-foreground">{lead.niche}</span>}
      </div>
    </div>
  );
}

function Column({
  status,
  leads,
}: {
  status: PipelineStatus;
  leads: LeadCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-lg border bg-muted/20",
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="border-b px-3 py-2">
        <div className="text-sm font-semibold">{PIPELINE_LABELS[status]}</div>
        <div className="text-xs text-muted-foreground">{leads.length}</div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-auto p-2" style={{ maxHeight: "70vh" }}>
        {leads.map((l) => (
          <CardItem key={l.id} lead={l} />
        ))}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [columns, setColumns] = useState<Record<string, LeadCard[]>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const res = await fetch("/api/pipeline");
    const data = await res.json();
    setColumns(data.columns || {});
  }

  useEffect(() => {
    void load();
  }, []);

  async function onDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || !PIPELINE_STATUSES.includes(overId as PipelineStatus)) return;

    // optimistic
    setColumns((prev) => {
      const next: Record<string, LeadCard[]> = Object.fromEntries(
        Object.entries(prev).map(([k, v]) => [k, v.filter((l) => l.id !== leadId)])
      );
      const moved = Object.values(prev).flat().find((l) => l.id === leadId);
      if (moved) next[overId] = [...(next[overId] || []), moved];
      return next;
    });

    const res = await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, pipelineStatus: overId }),
    });
    if (!res.ok) {
      toast.error("Failed to move lead");
      void load();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Drag cards between stages. Moves are logged on the lead timeline.</p>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STATUSES.map((status) => (
            <Column key={status} status={status} leads={columns[status] || []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
