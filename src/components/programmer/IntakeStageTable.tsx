import type { IntakeStageRow } from "@/hooks/staff/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Props = {
  rows: IntakeStageRow[];
  isLoading: boolean;
};

export function IntakeStageTable({ rows, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="glass-card p-4 text-sm text-muted-foreground">Loading intake history…</Card>
    );
  }

  if (!rows.length) {
    return null;
  }

  return (
    <Card className="glass-card overflow-hidden p-0">
      <div className="border-b border-border/60 px-4 py-2">
        <p className="eyebrow">Intake history</p>
        <p className="text-xs text-muted-foreground">Staged attempts for this day</p>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.raw_text.slice(0, 80)}{r.raw_text.length > 80 ? "…" : ""}</p>
              <p className="font-mono-num mt-0.5 text-[10px] text-muted-foreground">
                {format(new Date(r.created_at), "h:mm a")} · {r.parser_mode}
                {r.latency_ms != null ? ` · ${r.latency_ms}ms` : ""}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                r.status === "committed"
                  ? "border-primary/50 text-primary"
                  : r.status === "rejected"
                    ? "text-muted-foreground"
                    : ""
              }
            >
              {r.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
