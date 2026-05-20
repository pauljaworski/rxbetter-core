import { useEffect, useMemo, useState } from "react";
import { daysSince, fmtWeight } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useBenchmarkSummaries, type PrRow } from "@/hooks/useBenchmarkSummaries";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { EmptyState } from "@/components/layout/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { PrProgressDialog } from "@/components/rx/PrProgressDialog";

type SortKey = "recent" | "stale" | "heaviest";

export default function PRs() {
  const { contactId } = useAuth();
  const { data: rows, isLoading: loading, error, isEmpty } = useBenchmarkSummaries(contactId);
  const [stim, setStim] = useState<string | null>(null);
  const [subStim, setSubStim] = useState<string>("all");
  const [purpose, setPurpose] = useState<string>("all");
  const [rep, setRep] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("heaviest");
  const [openRow, setOpenRow] = useState<PrRow | null>(null);

  const stimuli = useMemo(() => Array.from(new Set(rows.map((r) => r.stimulus).filter(Boolean) as string[])), [rows]);

  const subStimuli = useMemo(() => {
    const pool = stim ? rows.filter((r) => r.stimulus === stim) : rows;
    return Array.from(new Set(pool.map((r) => r.sub_stimulus).filter(Boolean) as string[])).sort();
  }, [rows, stim]);

  const purposes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.purpose_variation).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const repCounts = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.rep_count))).sort((a, b) => a - b);
  }, [rows]);

  const visible = useMemo(() => {
    let v = rows;
    if (stim) v = v.filter((r) => r.stimulus === stim);
    if (subStim !== "all") v = v.filter((r) => r.sub_stimulus === subStim);
    if (purpose !== "all") v = v.filter((r) => r.purpose_variation === purpose);
    if (rep !== "all") v = v.filter((r) => String(r.rep_count) === rep);
    v = [...v].sort((a, b) => {
      if (sort === "heaviest") return (b.current_pr_weight ?? 0) - (a.current_pr_weight ?? 0);
      const da = a.date_pr_achieved ? new Date(a.date_pr_achieved).getTime() : 0;
      const db = b.date_pr_achieved ? new Date(b.date_pr_achieved).getTime() : 0;
      return sort === "recent" ? db - da : da - db;
    });
    return v;
  }, [rows, stim, subStim, rep, sort]);

  // Reset sub-stimulus when stimulus changes and current pick is no longer in scope
  useEffect(() => {
    if (subStim !== "all" && !subStimuli.includes(subStim)) setSubStim("all");
  }, [subStimuli, subStim]);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Personal Records</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Your PR vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} tracked lift{rows.length === 1 ? "" : "s"} · stale lifts deserve a fresh attempt.
        </p>
      </header>

      {error && <ErrorBanner message={error} />}
      {!loading && !error && isEmpty && (
        <EmptyState title="No PRs yet" description="Log strength work on Today to build your vault." />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={stim === null ? "default" : "secondary"} onClick={() => setStim(null)}>
          All
        </Button>
        {stimuli.map((s) => (
          <Button key={s} size="sm" variant={stim === s ? "default" : "secondary"} onClick={() => setStim(s)}>
            {s}
          </Button>
        ))}
        <Select value={subStim} onValueChange={setSubStim}>
          <SelectTrigger className="h-9 w-[150px] bg-secondary text-xs">
            <SelectValue placeholder="Movement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All movements</SelectItem>
            {subStimuli.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rep} onValueChange={setRep}>
          <SelectTrigger className="h-9 w-[110px] bg-secondary text-xs">
            <SelectValue placeholder="Reps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reps</SelectItem>
            {repCounts.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} RM
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {purposes.length > 0 && (
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger className="h-9 w-[150px] bg-secondary text-xs">
              <SelectValue placeholder="Variation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All variations</SelectItem>
              {purposes.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto flex items-center gap-1 rounded-md border border-border bg-secondary p-0.5">
          {(["heaviest", "recent", "stale"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={
                "rounded px-2.5 py-1 text-xs font-medium capitalize " +
                (sort === k ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageSkeleton rows={3} />
      ) : !error && !isEmpty ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => {
            const days = daysSince(r.date_pr_achieved);
            const stale = days != null && days > 90;
            return (
              <Card
                key={r.id}
                onClick={() => setOpenRow(r)}
                className="glass-card relative cursor-pointer overflow-hidden p-5 transition hover:border-primary/50 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="eyebrow">{r.rep_count} RM</p>
                    <h3 className="mt-1 text-lg font-bold leading-tight">{r.bench_name}</h3>
                  </div>
                  {stale && <Badge className="bg-accent text-accent-foreground hover:bg-accent">Stale</Badge>}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono-num text-5xl font-black neon-text">{fmtWeight(r.current_pr_weight)}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">lb</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {r.stimulus && (
                    <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {r.stimulus}
                    </span>
                  )}
                  {r.sub_stimulus && (
                    <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {r.sub_stimulus}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span>{r.date_pr_achieved ? format(new Date(r.date_pr_achieved + "T00:00:00"), "MMM d, yyyy") : "—"}</span>
                  <span className="font-mono-num">{days != null ? `${days}d ago` : ""}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <PrProgressDialog
        open={!!openRow}
        onOpenChange={(o) => !o && setOpenRow(null)}
        benchmarkTypeId={openRow?.benchmark_type_id ?? null}
        benchmarkName={openRow?.bench_name ?? ""}
        repCount={openRow?.rep_count ?? null}
        stimulus={openRow?.stimulus ?? null}
        metric="weight"
      />
    </div>
  );
}