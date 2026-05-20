import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePerformanceHistory } from "@/hooks/usePerformanceHistory";
import { WorkoutHistoryList } from "@/components/workout/WorkoutHistoryList";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "recent" | "stale" | "heaviest";

export default function History() {
  const { contactId } = useAuth();
  const { data: rows, isLoading, error, isEmpty } = usePerformanceHistory(contactId);
  const [subStim, setSubStim] = useState<string>("all");
  const [purpose, setPurpose] = useState<string>("all");
  const [rep, setRep] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const subStimuli = useMemo(
    () => Array.from(new Set(rows.map((r) => r.sub_stimulus).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const purposes = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.purpose_variation).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const repCounts = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.rep_count).filter((v) => v != null) as number[])).sort(
        (a, b) => a - b,
      ),
    [rows],
  );

  const visible = useMemo(() => {
    let v = rows;
    if (subStim !== "all") v = v.filter((r) => r.sub_stimulus === subStim);
    if (purpose !== "all") v = v.filter((r) => r.purpose_variation === purpose);
    if (rep !== "all") v = v.filter((r) => String(r.rep_count) === rep);
    v = [...v].sort((a, b) => {
      if (sort === "heaviest")
        return (Number(b.weight_lifted) || 0) - (Number(a.weight_lifted) || 0);
      const da = a.performance_date
        ? new Date(a.performance_date).getTime()
        : new Date(a.created_at).getTime();
      const db = b.performance_date
        ? new Date(b.performance_date).getTime()
        : new Date(b.created_at).getTime();
      return sort === "recent" ? db - da : da - db;
    });
    return v;
  }, [rows, subStim, purpose, rep, sort]);

  useEffect(() => {
    if (subStim !== "all" && !subStimuli.includes(subStim)) setSubStim("all");
  }, [subStimuli, subStim]);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Training History</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Every rep, on the record.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Class WODs and imported scores — {rows.length} entries
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={subStim} onValueChange={setSubStim}>
          <SelectTrigger className="h-9 w-[160px] bg-secondary text-xs">
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
          {(["recent", "heaviest", "stale"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={
                "rounded px-2.5 py-1 text-xs font-medium capitalize " +
                (sort === k
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <PageSkeleton rows={5} />}
      {!isLoading && !error && isEmpty && (
        <EmptyState
          title="No history yet"
          description="Log a score on Today or Calendar to build your ledger."
          actionLabel="Go to Today"
          onAction={() => {
            window.location.href = "/";
          }}
        />
      )}
      {!isLoading && !error && !isEmpty && visible.length === 0 && (
        <EmptyState title="No matches" description="Try clearing filters." />
      )}
      {!isLoading && !error && visible.length > 0 && (
        <WorkoutHistoryList rows={visible} />
      )}
    </div>
  );
}
