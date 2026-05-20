import { format } from "date-fns";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PerformanceHistoryRow } from "@/hooks/usePerformanceHistory";

export function WorkoutHistoryList({ rows }: { rows: PerformanceHistoryRow[] }) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <Card key={r.id} className="glass-card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="font-mono-num grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary text-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {r.performance_date
                  ? format(new Date(r.performance_date + "T00:00:00"), "MMM")
                  : "—"}
              </span>
              <span className="-mt-1 text-base font-black leading-none">
                {r.performance_date
                  ? format(new Date(r.performance_date + "T00:00:00"), "d")
                  : ""}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {r.bench_name ?? r.wod_name ?? (r.programming_id ? "Class WOD" : "Logged score")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {r.wod_name ?? (r.programming_id ? "" : "Import / personal")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {r.is_pr && (
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                <Flame className="mr-1 h-3 w-3" /> PR
              </Badge>
            )}
            <span className="font-mono-num text-right text-base font-bold">
              {r.weight_lifted ? `${Math.round(Number(r.weight_lifted))} lb` : r.score ?? "—"}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
