import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TierBadge({ tier, score }: { tier?: string | null; score?: number | null }) {
  const t = (tier || "D").toUpperCase();
  const variant =
    t === "A" ? "success" : t === "B" ? "default" : t === "C" ? "warning" : "secondary";
  return (
    <Badge variant={variant as "success"} className={cn("font-mono")}>
      {t}
      {score != null ? ` · ${Math.round(score)}` : ""}
    </Badge>
  );
}
