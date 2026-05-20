import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benchmarkTypeId: string | null;
  benchmarkName: string;
  repCount: number | null;
  stimulus?: string | null;
  /** "weight" for lifts, "time" for for-time metcons (mm:ss → seconds, lower is better), "amrap" for rounds/reps (higher is better) */
  metric?: "weight" | "time" | "amrap";
};

type Point = {
  date: string; // YYYY-MM-DD
  label: string;
  value: number;
  raw: string; // display value
};

function parseScoreToSeconds(score: string): number | null {
  const s = score.trim();
  // mm:ss or h:mm:ss
  const parts = s.split(":").map((x) => Number(x));
  if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

function parseScoreToReps(score: string): number | null {
  // Take leading number (e.g., "20", "20 + 5")
  const m = score.trim().match(/^(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]);
}

function fmtSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.round(total % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PrProgressDialog({
  open,
  onOpenChange,
  benchmarkTypeId,
  benchmarkName,
  repCount,
  stimulus,
  metric,
}: Props) {
  const { contactId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

  // Infer metric if not provided. Lifts → weight; for_time-ish → time; otherwise amrap (reps/rounds).
  const resolvedMetric: "weight" | "time" | "amrap" = useMemo(() => {
    if (metric) return metric;
    if (stimulus === "strength") return "weight";
    return "time";
  }, [metric, stimulus]);

  useEffect(() => {
    if (!open || !benchmarkTypeId || !contactId) return;
    setLoading(true);
    setPoints([]);
    (async () => {
      // Pull all performances for this benchmark type
      const { data: perfs } = await supabase
        .from("athlete_performance")
        .select(
          "id, performance_date, created_at, score, weight_lifted, benchmark_type_id, benchmark_definition_id",
        )
        .eq("contact_id", contactId)
        .eq("benchmark_type_id", benchmarkTypeId)
        .order("performance_date", { ascending: true, nullsFirst: false });

      let filtered = (perfs ?? []) as any[];

      // Filter by rep_count for weight metric — must match exactly.
      if (resolvedMetric === "weight" && repCount != null) {
        const defIds = Array.from(
          new Set(filtered.map((p) => p.benchmark_definition_id).filter(Boolean) as string[]),
        );
        const { data: defs } = defIds.length
          ? await supabase
              .from("benchmark_definition")
              .select("id, rep_count")
              .in("id", defIds)
          : { data: [] as any[] };
        const okDefs = new Set((defs ?? []).filter((d: any) => d.rep_count === repCount).map((d: any) => d.id));
        filtered = filtered.filter((p) => p.benchmark_definition_id && okDefs.has(p.benchmark_definition_id));
      }

      const pts: Point[] = [];
      for (const p of filtered) {
        const date = p.performance_date ?? p.created_at?.slice(0, 10);
        if (!date) continue;
        if (resolvedMetric === "weight") {
          const w = Number(p.weight_lifted);
          if (!Number.isFinite(w) || w <= 0) continue;
          pts.push({ date, label: format(new Date(date + "T00:00:00"), "MMM d"), value: w, raw: `${Math.round(w)} lb` });
        } else if (resolvedMetric === "time") {
          if (!p.score) continue;
          const secs = parseScoreToSeconds(p.score);
          if (secs == null) continue;
          pts.push({ date, label: format(new Date(date + "T00:00:00"), "MMM d"), value: secs, raw: p.score });
        } else {
          if (!p.score) continue;
          const reps = parseScoreToReps(p.score);
          if (reps == null) continue;
          pts.push({ date, label: format(new Date(date + "T00:00:00"), "MMM d"), value: reps, raw: p.score });
        }
      }

      pts.sort((a, b) => a.date.localeCompare(b.date));
      setPoints(pts);
      setLoading(false);
    })();
  }, [open, benchmarkTypeId, repCount, resolvedMetric, contactId]);

  const best = useMemo(() => {
    if (points.length === 0) return null;
    if (resolvedMetric === "time") {
      return points.reduce((a, b) => (b.value < a.value ? b : a));
    }
    return points.reduce((a, b) => (b.value > a.value ? b : a));
  }, [points, resolvedMetric]);

  const yLabel = resolvedMetric === "weight" ? "lb" : resolvedMetric === "time" ? "time" : "reps";
  const subtitle =
    resolvedMetric === "weight"
      ? `${repCount ?? "?"} RM progression`
      : resolvedMetric === "time"
      ? "For-time progression (lower is better)"
      : "Score progression";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">{benchmarkName}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : points.length === 0 ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
            No matching attempts yet. Log a score to see progress here.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border border-border bg-secondary/40 p-3">
                <p className="eyebrow">Attempts</p>
                <p className="font-mono-num mt-1 text-2xl font-black">{points.length}</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/40 p-3">
                <p className="eyebrow">Best</p>
                <p className="font-mono-num mt-1 text-2xl font-black neon-text">
                  {best?.raw ?? "—"}
                </p>
              </div>
              <div className="rounded-md border border-border bg-secondary/40 p-3">
                <p className="eyebrow">Latest</p>
                <p className="font-mono-num mt-1 text-2xl font-black">{points[points.length - 1].raw}</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (resolvedMetric === "time" ? fmtSeconds(Number(v)) : String(Math.round(Number(v))))}
                    width={resolvedMetric === "time" ? 56 : 40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [
                      resolvedMetric === "time"
                        ? fmtSeconds(value)
                        : `${Math.round(value)} ${yLabel}`,
                      benchmarkName,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 5 }}
                  />
                  {best && (
                    <ReferenceDot
                      x={best.label}
                      y={best.value}
                      r={6}
                      fill="hsl(var(--accent))"
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="max-h-40 overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-right font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((p, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="px-3 py-2 text-muted-foreground">
                        {format(new Date(p.date + "T00:00:00"), "MMM d, yyyy")}
                      </td>
                      <td className="font-mono-num px-3 py-2 text-right font-semibold">{p.raw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}