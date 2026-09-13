import { useMemo, useState } from "react";
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
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { segmentLabel } from "@/lib/format";
import { isMetconSegment, metconFormatLabel } from "@/lib/programming/manual-config";
import { summarizeSegmentPrescription } from "@/lib/programming/segment-prescription-summary";
import {
  buildWorkoutDayBlocks,
  type WorkoutDayBlock,
} from "@/lib/programming/workout-segment-groups";
import type {
  StaffClassContact,
  StaffClassLineItem,
  StaffClassPerformance,
  StaffClassWod,
} from "@/hooks/staff/types";
import type { WorkoutDayProgramming } from "@/hooks/useWorkoutDay";

function toDayProgramming(
  w: StaffClassWod,
  items: StaffClassLineItem[],
): WorkoutDayProgramming {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    athlete_notes: w.athlete_notes,
    coaches_notes: w.coaches_notes,
    programming_segment: w.programming_segment,
    metcon_format: w.metcon_format,
    workout_scheme: w.workout_scheme ?? null,
    segment_group_id: w.segment_group_id ?? null,
    group_score_anchor: w.group_score_anchor ?? false,
    programming_subtype: w.programming_subtype ?? null,
    display_order: w.display_order,
    wod_date: "",
    prescribed_scale: null,
    items: items.map((it) => ({
      id: it.id,
      programming_id: it.programming_id,
      contact_id: null,
      sequence_number: it.sequence_number,
      reps_prescribed: it.reps_prescribed,
      prescribed_weight: it.prescribed_weight,
      prescribed_percentage: it.prescribed_percentage,
      prescribed_score: it.prescribed_score,
      benchmark_type_id: it.benchmark_type_id,
      benchmark_definition_id: null,
      status: null,
      bench_name: it.bench_name ?? undefined,
    })),
  };
}

function scoreLabel(p: StaffClassPerformance): string {
  if (p.weight_lifted != null) return `${p.weight_lifted} lb`;
  return p.score ?? "—";
}

function filterPerfs(
  perfs: StaffClassPerformance[],
  contacts: Map<string, StaffClassContact>,
  needle: string,
): StaffClassPerformance[] {
  if (!needle) return perfs;
  return perfs.filter((p) => contacts.get(p.contact_id)?.name.toLowerCase().includes(needle));
}

export default function StaffClassDay() {
  const { activeGymId, activePersona } = useAuth();
  const canEditScores = activePersona === "admin" || activePersona === "coach";
  const [date, setDate] = useState<Date>(new Date());
  const { data, isLoading, error, isEmpty, refetch } = useStaffClassDay(activeGymId, date);
  const { wods, itemsByWod, perfByItem, perfBySegment, perfByGroup, contacts, totalLogged } = data;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditScoreContext | null>(null);

  const searchNeedle = search.trim().toLowerCase();

  const dayProgramming = useMemo(
    () => wods.map((w) => toDayProgramming(w, itemsByWod.get(w.id) ?? [])),
    [wods, itemsByWod],
  );
  const blocks = useMemo(() => buildWorkoutDayBlocks(dayProgramming), [dayProgramming]);
  const wodById = useMemo(() => new Map(wods.map((w) => [w.id, w])), [wods]);

  function openEdit(
    perf: StaffClassPerformance,
    wod: StaffClassWod,
    item: StaffClassLineItem | null,
  ) {
    const c = contacts.get(perf.contact_id);
    if (!c || !canEditScores) return;
    setEditing({
      perf,
      item: item ?? {
        id: "",
        programming_id: wod.id,
        sequence_number: null,
        reps_prescribed: null,
        prescribed_weight: null,
        prescribed_percentage: null,
        prescribed_score: null,
        benchmark_type_id: null,
        bench_name: "Score",
      },
      wod,
      contact: c,
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Class day</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          {format(date, "EEEE, MMM d")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Same workout layout athletes see, plus coach notes and condensed scores.{" "}
          {canEditScores ? "Tap a score to edit." : "Read-only for your role."}
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <Card className="glass-card flex items-center justify-between p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDate(addDays(date, -1))}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-mono-num text-sm font-bold">{format(date, "EEE, MMM d, yyyy")}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {blocks.length} block{blocks.length === 1 ? "" : "s"} · {totalLogged} score
            {totalLogged === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDate(addDays(date, 1))}
          aria-label="Next day"
        >
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
          title="No workout published yet"
          description={`Nothing published for ${format(date, "EEE, MMM d")}.`}
        />
      )}

      {!isLoading &&
        !error &&
        blocks.map((block) => (
          <CoachWorkoutBlock
            key={block.kind === "group" ? block.groupId : block.wod.id}
            block={block}
            wodById={wodById}
            itemsByWod={itemsByWod}
            perfByItem={perfByItem}
            perfBySegment={perfBySegment}
            perfByGroup={perfByGroup}
            contacts={contacts}
            searchNeedle={searchNeedle}
            canEditScores={canEditScores}
            onEdit={openEdit}
          />
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

function CoachWorkoutBlock({
  block,
  wodById,
  itemsByWod,
  perfByItem,
  perfBySegment,
  perfByGroup,
  contacts,
  searchNeedle,
  canEditScores,
  onEdit,
}: {
  block: WorkoutDayBlock;
  wodById: Map<string, StaffClassWod>;
  itemsByWod: Map<string, StaffClassLineItem[]>;
  perfByItem: Map<string, StaffClassPerformance[]>;
  perfBySegment: Map<string, StaffClassPerformance[]>;
  perfByGroup: Map<string, StaffClassPerformance[]>;
  contacts: Map<string, StaffClassContact>;
  searchNeedle: string;
  canEditScores: boolean;
  onEdit: (perf: StaffClassPerformance, wod: StaffClassWod, item: StaffClassLineItem | null) => void;
}) {
  const parts = block.kind === "group" ? block.parts : [block.wod];
  const anchor = block.kind === "group" ? block.anchor : block.wod;
  const anchorStaff = wodById.get(anchor.id);
  if (!anchorStaff) return null;

  const groupScores =
    block.kind === "group"
      ? filterPerfs(perfByGroup.get(block.groupId) ?? [], contacts, searchNeedle)
      : [];

  return (
    <Card className="glass-card overflow-hidden p-0">
      {block.kind === "group" && (
        <div className="border-b border-border/60 bg-secondary/20 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Multi-part · {parts.length} segments
          </p>
        </div>
      )}

      {parts.map((prog) => {
        const wod = wodById.get(prog.id);
        if (!wod) return null;
        const items = itemsByWod.get(wod.id) ?? [];
        const summary = summarizeSegmentPrescription(
          {
            programming_segment: wod.programming_segment ?? "metcon",
            metcon_format: wod.metcon_format,
            workout_scheme: wod.workout_scheme,
            name: wod.name,
          },
          items.map((it) => ({
            id: it.id,
            sequence_number: it.sequence_number,
            reps_prescribed: it.reps_prescribed,
            prescribed_weight: it.prescribed_weight,
            prescribed_percentage: it.prescribed_percentage,
            prescribed_score: it.prescribed_score,
            benchmark_type_id: it.benchmark_type_id,
            benchmark_definition_id: null,
            status: null,
            bench_name: it.bench_name ?? undefined,
          })),
          null,
        );
        const formatLabel = metconFormatLabel(wod.metcon_format);
        const segmentScores = filterPerfs(perfBySegment.get(wod.id) ?? [], contacts, searchNeedle);
        const metcon = isMetconSegment(wod.programming_segment ?? "");

        return (
          <div key={wod.id} className="border-b border-border/60 last:border-b-0">
            <div className="bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="eyebrow">
                    {segmentLabel(wod.programming_segment)}
                    {formatLabel ? ` · ${formatLabel}` : ""}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold leading-tight">
                    {wod.name ?? "Untitled"}
                  </h3>
                  {summary.header && (
                    <p className="mt-1 font-mono-num text-xs text-muted-foreground">
                      {summary.header}
                    </p>
                  )}
                </div>
              </div>

              {summary.lines.length > 0 && (
                <ul className="mt-3 space-y-0.5 text-sm">
                  {summary.lines.map((line, i) => (
                    <li key={i} className="text-foreground/90">
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              {wod.description && (
                <p className="mt-2 text-xs text-muted-foreground">{wod.description}</p>
              )}
              {wod.athlete_notes && (
                <p className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
                  <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground/80">Athletes: </span>
                    {wod.athlete_notes}
                  </span>
                </p>
              )}
              {wod.coaches_notes && (
                <p className="mt-2 flex gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-2 text-xs text-foreground/90">
                  <NotebookPen className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                  <span>
                    <span className="font-semibold">Coaches: </span>
                    {wod.coaches_notes}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-3 p-4">
              {metcon && (
                <ScoreList
                  title="Segment scores"
                  perfs={segmentScores}
                  contacts={contacts}
                  empty={searchNeedle ? "No matching athletes." : "No segment scores yet."}
                  canEdit={canEditScores}
                  onSelect={(p) => onEdit(p, wod, null)}
                />
              )}

              {!metcon &&
                items.map((it) => {
                  const perfs = filterPerfs(perfByItem.get(it.id) ?? [], contacts, searchNeedle);
                  return (
                    <div key={it.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">{it.bench_name ?? "Set"}</p>
                        <p className="font-mono-num text-[11px] text-muted-foreground">
                          {(perfByItem.get(it.id) ?? []).length} logged
                        </p>
                      </div>
                      <ScoreList
                        title=""
                        perfs={perfs}
                        contacts={contacts}
                        empty={searchNeedle ? "No matching athletes." : "No scores yet."}
                        canEdit={canEditScores}
                        onSelect={(p) => onEdit(p, wod, it)}
                        compact
                      />
                    </div>
                  );
                })}

              {metcon && items.length > 0 && (
                <div className="border-t border-border/40 pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Movement logs
                  </p>
                  {items.map((it) => {
                    const perfs = filterPerfs(perfByItem.get(it.id) ?? [], contacts, searchNeedle);
                    if (perfs.length === 0 && !searchNeedle) return null;
                    return (
                      <div key={it.id} className="mb-2 last:mb-0">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          {it.bench_name ?? "Movement"}
                        </p>
                        <ScoreList
                          title=""
                          perfs={perfs}
                          contacts={contacts}
                          empty="—"
                          canEdit={canEditScores}
                          onSelect={(p) => onEdit(p, wod, it)}
                          compact
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {block.kind === "group" && (
        <div className="border-t border-border/60 bg-secondary/10 p-4">
          <ScoreList
            title="Group score"
            perfs={groupScores}
            contacts={contacts}
            empty={searchNeedle ? "No matching athletes." : "No group scores yet."}
            canEdit={canEditScores}
            onSelect={(p) => onEdit(p, anchorStaff, null)}
          />
        </div>
      )}
    </Card>
  );
}

function ScoreList({
  title,
  perfs,
  contacts,
  empty,
  canEdit,
  onSelect,
  compact,
}: {
  title: string;
  perfs: StaffClassPerformance[];
  contacts: Map<string, StaffClassContact>;
  empty: string;
  canEdit: boolean;
  onSelect: (p: StaffClassPerformance) => void;
  compact?: boolean;
}) {
  return (
    <div>
      {title && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      {perfs.length === 0 ? (
        <p className={cn("text-[11px] italic text-muted-foreground", !compact && "pl-0")}>
          {empty}
        </p>
      ) : (
        <ul className="space-y-1">
          {perfs.map((p) => {
            const c = contacts.get(p.contact_id);
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                  canEdit && c && "cursor-pointer hover:bg-secondary/60",
                )}
                onClick={() => canEdit && c && onSelect(p)}
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
                  {p.workout_scale && (
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {p.workout_scale.replace("_", "+")}
                    </span>
                  )}
                  {p.is_pr && (
                    <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
                      <Flame className="h-3 w-3" /> PR
                    </Badge>
                  )}
                  <span className="font-mono-num text-sm font-bold text-primary">
                    {scoreLabel(p)}
                  </span>
                  {canEdit && <Pencil className="h-3 w-3 text-muted-foreground" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
