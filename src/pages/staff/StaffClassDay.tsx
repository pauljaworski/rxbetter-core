import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffClassDay } from "@/hooks/staff/useStaffClassDay";
import { EditScoreSheet, type EditScoreContext } from "@/components/coach/EditScoreSheet";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { addDays, format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Pencil,
  Search,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { segmentLabel } from "@/lib/format";

export default function StaffClassDay() {
  const { activeGymId, activePersona } = useAuth();
  const canEditScores = activePersona === "admin" || activePersona === "coach";
  const [date, setDate] = useState<Date>(new Date());
  const { data, isLoading, error, isEmpty, refetch } = useStaffClassDay(activeGymId, date);
  const { wods, itemsByWod, perfByItem, contacts, totalLogged } = data;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditScoreContext | null>(null);

  const searchNeedle = search.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Class day</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">{format(date, "EEEE, MMM d")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See every score logged for today's programming.{" "}
          {canEditScores ? "Tap any row to edit." : "Read-only for your role."}
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <Card className="glass-card flex items-center justify-between p-2">
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-mono-num text-sm font-bold">{format(date, "EEE, MMM d, yyyy")}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {wods.length} WOD{wods.length === 1 ? "" : "s"} · {totalLogged} score{totalLogged === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter athletes by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && <PageSkeleton rows={3} />}
      {!isLoading && !error && isEmpty && (
        <EmptyState
          title="No programming"
          description={`Nothing scheduled for ${format(date, "EEE, MMM d")}.`}
        />
      )}
      {!isLoading &&
        !error &&
        wods.map((w) => (
          <Card key={w.id} className="glass-card overflow-hidden p-0">
            <div className="border-b border-border/60 bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="eyebrow">
                    {segmentLabel(w.programming_segment)}
                    {w.metcon_format ? ` · ${w.metcon_format.toUpperCase()}` : ""}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold leading-tight">{w.name ?? "Untitled"}</h3>
                </div>
              </div>
              {w.coaches_notes && (
                <p className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
                  <NotebookPen className="mt-0.5 h-3 w-3 shrink-0" />
                  {w.coaches_notes}
                </p>
              )}
            </div>
            <div className="divide-y divide-border/60">
              {(itemsByWod.get(w.id) ?? []).length === 0 && (
                <div className="p-5 text-sm text-muted-foreground">No prescribed sets.</div>
              )}
              {(itemsByWod.get(w.id) ?? []).map((it) => {
                const allPerfs = perfByItem.get(it.id) ?? [];
                const perfs = allPerfs.filter((p) => {
                  if (!searchNeedle) return true;
                  const c = contacts.get(p.contact_id);
                  return c?.name.toLowerCase().includes(searchNeedle);
                });
                return (
                  <div key={it.id} className="p-4">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num inline-grid h-6 w-6 place-items-center rounded-md bg-secondary text-[11px] font-bold text-muted-foreground">
                          {it.sequence_number ?? "·"}
                        </span>
                        <p className="text-sm font-bold">{it.bench_name ?? "Set"}</p>
                      </div>
                      <p className="font-mono-num text-[11px] text-muted-foreground">
                        {allPerfs.length} logged
                      </p>
                    </div>
                    {perfs.length === 0 ? (
                      <p className="pl-8 text-[11px] italic text-muted-foreground">
                        {searchNeedle ? "No matching athletes." : "No scores yet."}
                      </p>
                    ) : (
                      <ul className="space-y-1 pl-8">
                        {perfs.map((p) => {
                          const c = contacts.get(p.contact_id);
                          const display =
                            p.weight_lifted != null ? `${p.weight_lifted} lb` : p.score ?? "—";
                          return (
                            <li
                              key={p.id}
                              className={cn(
                                "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                                canEditScores && c && "cursor-pointer hover:bg-secondary/60",
                              )}
                              onClick={() =>
                                canEditScores &&
                                c &&
                                setEditing({ perf: p, item: it, wod: w, contact: c })
                              }
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold uppercase">
                                  {c?.name
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("") ?? "—"}
                                </div>
                                <span className="truncate font-medium">{c?.name ?? "Athlete"}</span>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {p.rpe != null && (
                                  <span className="font-mono-num text-[10px] text-muted-foreground">
                                    RPE {p.rpe}
                                  </span>
                                )}
                                {p.is_pr && (
                                  <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
                                    <Flame className="h-3 w-3" /> PR
                                  </Badge>
                                )}
                                <span className="font-mono-num text-sm font-bold text-primary">
                                  {display}
                                </span>
                                {canEditScores && (
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      <EditScoreSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refetch();
        }}
      />
    </div>
  );
}
