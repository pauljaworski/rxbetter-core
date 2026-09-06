import { useEffect, useRef, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useProgramLibraries } from "@/hooks/useProgramLibraries";
import { useStaffProgrammingDay } from "@/hooks/staff/useStaffProgrammingDay";
import { useProgrammingSave } from "@/hooks/staff/useProgrammingSave";
import { useProgrammingPublish } from "@/hooks/staff/useProgrammingPublish";
import type { EditorLineItem, EditorWod } from "@/hooks/staff/types";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WodIntakePanel } from "@/components/programmer/WodIntakePanel";
import { SegmentAddDialog } from "@/components/programmer/SegmentAddDialog";
import { SegmentEditorCard } from "@/components/programmer/SegmentEditorCard";
import { ComplexSetEditor } from "@/components/programmer/ComplexSetEditor";
import { useBenchmarkCatalog } from "@/hooks/staff/useBenchmarkCatalog";
import { filterBenchmarkCatalog } from "@/lib/programming/manual-config";
import { deleteProgrammingSegment, persistProgrammingDisplayOrders } from "@/lib/programming/programming-delete";
import {
  canMoveSegment,
  cloneEditorWod,
  createBuyInMainCashOutDrafts,
  isSegmentUnsaved,
  linkSegmentWithPrevious,
  moveSegmentInDay,
  suggestDuplicateScale,
} from "@/lib/programming/staff-programming-state";
import {
  MovementPickerDialog,
  type MovementPick,
} from "@/components/programmer/MovementPickerDialog";

type ServerSyncMode = "date" | "save" | null;

export default function StaffProgramming() {
  const { activeGymId } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [wods, setWods] = useState<EditorWod[]>([]);
  const [serverSyncMode, setServerSyncMode] = useState<ServerSyncMode>("date");
  const pendingDraftsRef = useRef<EditorWod[]>([]);
  /** True until the first successful load for the current dateKey is applied to `wods`. */
  const awaitingDateSyncRef = useRef(true);
  const [segmentAddOpen, setSegmentAddOpen] = useState(false);
  const [showQuickIntake, setShowQuickIntake] = useState(false);
  const [movementPicker, setMovementPicker] = useState<{ wodIdx: number } | null>(null);
  const [complexEditor, setComplexEditor] = useState<{ wodIdx: number } | null>(null);
  const { data: benchmarkCatalog } = useBenchmarkCatalog();
  const strengthCatalog = filterBenchmarkCatalog(benchmarkCatalog, "weightlifting");
  const [savingSectionIdx, setSavingSectionIdx] = useState<number | null>(null);

  const dateKey = format(date, "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const {
    data: serverWods,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useStaffProgrammingDay(activeGymId, date);
  const { data: libraries } = useProgramLibraries(activeGymId);
  const defaultLibId = libraries[0]?.id ?? null;
  const { saveWod, busy: saving } = useProgrammingSave(activeGymId, date, defaultLibId);
  const { publishDay, publishWeek, busy: publishing } = useProgrammingPublish(activeGymId);

  useEffect(() => {
    setServerSyncMode("date");
    pendingDraftsRef.current = [];
    awaitingDateSyncRef.current = true;
    // Clear immediately so the previous day's segments never linger on an empty day.
    setWods([]);
  }, [dateKey]);

  useEffect(() => {
    if (isLoading || isRefreshing) return;

    if (serverSyncMode === "save") {
      setWods([...serverWods, ...pendingDraftsRef.current]);
      pendingDraftsRef.current = [];
      setServerSyncMode(null);
      awaitingDateSyncRef.current = false;
      return;
    }

    // Apply server day once load finishes — even if sync mode was cleared by a race.
    if (serverSyncMode === "date" || awaitingDateSyncRef.current) {
      setWods(serverWods);
      setServerSyncMode(null);
      awaitingDateSyncRef.current = false;
    }
  }, [serverWods, isLoading, isRefreshing, serverSyncMode]);

  function selectDate(next: Date) {
    const nextKey = format(next, "yyyy-MM-dd");
    if (nextKey === dateKey) return;
    const unsaved = wods.filter(isSegmentUnsaved);
    if (unsaved.length) {
      const ok = window.confirm(
        `You have ${unsaved.length} unsaved segment${unsaved.length === 1 ? "" : "s"} on ${format(date, "MMM d")}. Switch days anyway? Unsaved work will be lost.`,
      );
      if (!ok) return;
    }
    setDate(next);
  }

  function addWod(wod: EditorWod) {
    setServerSyncMode(null);
    setWods((prev) => [...prev, { ...wod, display_order: prev.length }]);
  }

  function updateWod(idx: number, patch: Partial<EditorWod>) {
    setServerSyncMode(null);
    setWods((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }

  async function handleRemoveWod(idx: number) {
    const wod = wods[idx];
    if (wod.id) {
      const msg = wod.published_at
        ? `Remove "${wod.name ?? "this segment"}"? It is published — athletes will no longer see it on Today or Calendar.`
        : `Delete "${wod.name ?? "this segment"}" permanently?`;
      if (!window.confirm(msg)) return;

      const { error } = await deleteProgrammingSegment(wod.id);
      if (error) {
        toast.error("Couldn't remove segment", { description: error });
        return;
      }
      toast.success(wod.published_at ? "Removed from athletes" : "Segment deleted");
    }
    setServerSyncMode(null);
    setWods((prev) => prev.filter((_, i) => i !== idx));
    if (wod.id) {
      setServerSyncMode("date");
      refetch();
    }
  }

  function addLineItem(wodIdx: number, pick: MovementPick) {
    setServerSyncMode(null);
    const setCount = Math.max(1, pick.sets || 1);
    const unit = pick.prescriptionUnit ?? "reps";
    const genderRx = {
      male: {
        reps: pick.reps,
        prescription_unit: unit,
        weight_lb: null as number | null,
        load_label: null as string | null,
        height_label: null as string | null,
      },
      female: {
        reps: pick.reps,
        prescription_unit: unit,
        weight_lb: null as number | null,
        load_label: null as string | null,
        height_label: null as string | null,
      },
    };
    setWods((prev) =>
      prev.map((w, i) => {
        if (i !== wodIdx) return w;
        const baseFields =
          pick.kind === "catalog"
            ? {
                benchmark_type_id: pick.bench.id,
                bench_name: pick.bench.name,
                movement_label: null as string | null,
              }
            : {
                benchmark_type_id: null as string | null,
                bench_name: pick.label,
                movement_label: pick.label,
              };
        const items: EditorLineItem[] = Array.from({ length: setCount }, (_, j) => ({
          _new: true as const,
          sequence_number: w.items.length + j + 1,
          reps_prescribed: pick.reps,
          prescription_unit: unit,
          prescribed_weight: null,
          prescribed_percentage: pick.prescribedPercentage,
          prescribed_score: null,
          percent_rep_max: 1,
          line_item_kind: "strength_set",
          movement_components: [],
          rx_variants: genderRx,
          ...baseFields,
        }));
        return { ...w, items: [...w.items, ...items] };
      }),
    );
  }

  function updateItem(wodIdx: number, itemIdx: number, patch: Partial<EditorLineItem>) {
    setServerSyncMode(null);
    setWods((prev) =>
      prev.map((w, i) =>
        i === wodIdx
          ? { ...w, items: w.items.map((it, j) => (j === itemIdx ? { ...it, ...patch } : it)) }
          : w,
      ),
    );
  }

  function removeItem(wodIdx: number, itemIdx: number) {
    setServerSyncMode(null);
    setWods((prev) =>
      prev.map((w, i) =>
        i === wodIdx ? { ...w, items: w.items.filter((_, j) => j !== itemIdx) } : w,
      ),
    );
  }

  function addComplexItems(wodIdx: number, items: EditorLineItem[]) {
    setServerSyncMode(null);
    setWods((prev) =>
      prev.map((w, i) => {
        if (i !== wodIdx) return w;
        const next = items.map((it, j) => ({
          ...it,
          sequence_number: w.items.length + j + 1,
        }));
        return { ...w, items: [...w.items, ...next] };
      }),
    );
  }

  function duplicateWod(wodIdx: number) {
    const src = wods[wodIdx];
    if (!src) return;
    const nextScale = suggestDuplicateScale(src.prescribed_scale);
    const clone = cloneEditorWod(src, wods.length, { prescribedScale: nextScale });
    setServerSyncMode(null);
    setWods((prev) => [...prev, clone]);
    if (nextScale !== src.prescribed_scale) {
      toast.message("Segment duplicated", {
        description: `Prescribed level set to ${nextScale.replace("_", " ")} — adjust if needed.`,
      });
    } else {
      toast.success("Segment duplicated");
    }
  }

  function linkWithPrevious(wodIdx: number) {
    setServerSyncMode(null);
    setWods((prev) => linkSegmentWithPrevious(prev, wodIdx));
    toast.message("Parts linked", {
      description: "Athletes will see one workout with one total score. Save each linked section.",
    });
  }

  async function handleMoveSegment(wodIdx: number, direction: "up" | "down") {
    if (!canMoveSegment(wods, wodIdx, direction)) return;
    setServerSyncMode(null);
    const next = moveSegmentInDay(wods, wodIdx, direction);
    setWods(next);

    const entries = next
      .map((w, i) => (w.id ? { id: w.id, display_order: i } : null))
      .filter((e): e is { id: string; display_order: number } => e != null);
    if (!entries.length) return;

    const { error } = await persistProgrammingDisplayOrders(entries);
    if (error) {
      toast.error("Order updated locally, but couldn't save to the server", {
        description: error,
      });
    }
  }

  function addBuyInMainCashOut() {
    const libIds = defaultLibId ? [defaultLibId] : [];
    if (!libIds.length) {
      toast.error("Add a program track first, then create the buy-in structure.");
      return;
    }
    const drafts = createBuyInMainCashOutDrafts(wods.length, libIds);
    setServerSyncMode(null);
    setWods((prev) => [...prev, ...drafts]);
    toast.message("Buy-in · Main · Cash-out added", {
      description: "Already linked as one score. Add movements to each part, then save all three.",
    });
  }

  function cloneItem(wodIdx: number, itemIdx: number) {
    setServerSyncMode(null);
    setWods((prev) =>
      prev.map((w, i) => {
        if (i !== wodIdx) return w;
        const src = w.items[itemIdx];
        if (!src) return w;
        const clone: EditorLineItem = {
          ...src,
          _new: true,
          id: undefined,
          sequence_number: w.items.length + 1,
        };
        return { ...w, items: [...w.items, clone] };
      }),
    );
  }

  async function saveAllUnsavedSections(): Promise<{ error: string | null; saved: number }> {
    let saved = 0;
    for (let i = 0; i < wods.length; i++) {
      const wod = wods[i];
      if (!isSegmentUnsaved(wod)) continue;
      const lib = wod.program_library_ids[0] ?? wod.program_library_id ?? defaultLibId;
      if (!lib) {
        return {
          error: `"${wod.name ?? "Segment"}" needs at least one track before it can be saved.`,
          saved,
        };
      }
      const { error: saveError } = await saveWod(wod, i);
      if (saveError) {
        return { error: saveError, saved };
      }
      saved++;
    }
    return { error: null, saved };
  }

  async function handleSaveSection(idx: number) {
    const wod = wods[idx];
    const lib = wod.program_library_ids[0] ?? wod.program_library_id ?? defaultLibId;
    if (!lib) {
      toast.error("Select at least one track for this section.");
      return;
    }

    setSavingSectionIdx(idx);
    const { error: saveError } = await saveWod(wod, idx);
    setSavingSectionIdx(null);

    if (saveError) {
      toast.error("Couldn't save section", { description: saveError });
      return;
    }

    toast.success("Section saved");
    pendingDraftsRef.current = wods.filter((w, i) => i !== idx && isSegmentUnsaved(w));
    setServerSyncMode("save");
    refetch();
  }

  async function handlePublishDay() {
    const { error: saveError, saved } = await saveAllUnsavedSections();
    if (saveError) {
      toast.error("Couldn't save before publish", { description: saveError });
      return;
    }

    const { error, count } = await publishDay(date);
    if (error) {
      toast.error("Couldn't publish", { description: error });
      return;
    }

    if (saved > 0) {
      toast.message(
        `Saved ${saved} unsaved segment${saved === 1 ? "" : "s"} before publishing`,
      );
    }
    toast.success(
      count > 0
        ? `Published ${count} segment${count === 1 ? "" : "s"} for this day`
        : saved > 0
          ? "All saved segments were already published"
          : "Nothing new to publish for this day",
    );
    pendingDraftsRef.current = [];
    setServerSyncMode("date");
    refetch();
  }

  async function handlePublishWeek() {
    const { error, count } = await publishWeek(weekStart);
    if (error) {
      toast.error("Couldn't publish", { description: error });
      return;
    }
    toast.success(
      count > 0
        ? `Published ${count} segment${count === 1 ? "" : "s"} this week`
        : "Nothing new to publish this week",
    );
    setServerSyncMode("date");
    refetch();
  }

  const busy = saving || publishing || isRefreshing;
  const unsavedCount = wods.filter(isSegmentUnsaved).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Programmer</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Programming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a day, add multiple segments, save each section (or publish day to save and publish
          together).
        </p>
        {unsavedCount > 0 && (
          <p className="mt-2 text-xs font-medium text-amber-600">
            {unsavedCount} unsaved segment{unsavedCount === 1 ? "" : "s"} on this day — save or use
            Publish day before switching dates.
          </p>
        )}
      </header>

      {error && <ErrorBanner message={error} />}

      {/* Calendar */}
      <Card className="glass-card p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <Button size="icon" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
          </span>
          <Button size="icon" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const k = format(d, "yyyy-MM-dd");
            const isSel = k === dateKey;
            return (
              <button
                key={k}
                type="button"
                onClick={() => selectDate(d)}
                className={cn(
                  "flex flex-col items-center rounded-lg border px-1 py-2 text-center transition-colors",
                  isSel
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary",
                )}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {format(d, "EEE")}
                </span>
                <span className="font-mono-num text-base font-black">{format(d, "d")}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Day actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setSegmentAddOpen(true)} size="sm" variant="secondary">
          <Plus className="mr-1 h-3.5 w-3.5" /> Segment
        </Button>
        <Button
          onClick={() => void handlePublishDay()}
          disabled={busy}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="mr-1 h-3.5 w-3.5" /> Publish day
        </Button>
        <Button onClick={() => void handlePublishWeek()} disabled={busy} size="sm" variant="outline">
          <Send className="mr-1 h-3.5 w-3.5" /> Publish week
        </Button>
      </div>

      {(isLoading || (isRefreshing && wods.length === 0)) && <PageSkeleton rows={4} />}
      {!isLoading && !isRefreshing && !error && wods.length === 0 && (
        <EmptyState
          title="Nothing scheduled"
          description={`${format(date, "EEE, MMM d")} is empty. Click Segment to add or copy programming.`}
        />
      )}
      {!isLoading && wods.length > 0 && (
        <div className="space-y-4">
          {wods.map((w, idx) => (
            <SegmentEditorCard
              key={w.id ?? `new-${idx}-${w.display_order}`}
              wod={w}
              wodIndex={idx}
              allWods={wods}
              libraries={libraries}
              saving={savingSectionIdx === idx}
              onUpdate={(patch) => updateWod(idx, patch)}
              onRemove={() => void handleRemoveWod(idx)}
              onSaveSection={() => void handleSaveSection(idx)}
              onUpdateItem={(itemIdx, patch) => updateItem(idx, itemIdx, patch)}
              onRemoveItem={(itemIdx) => removeItem(idx, itemIdx)}
              onCloneItem={(itemIdx) => cloneItem(idx, itemIdx)}
              onDuplicate={() => duplicateWod(idx)}
              onAddMovement={() => setMovementPicker({ wodIdx: idx })}
              onOpenComplexEditor={() => setComplexEditor({ wodIdx: idx })}
              onLinkWithPrevious={() => linkWithPrevious(idx)}
              canMoveUp={canMoveSegment(wods, idx, "up")}
              canMoveDown={canMoveSegment(wods, idx, "down")}
              onMoveUp={() => void handleMoveSegment(idx, "up")}
              onMoveDown={() => void handleMoveSegment(idx, "down")}
            />
          ))}
        </div>
      )}

      <SegmentAddDialog
        open={segmentAddOpen}
        onOpenChange={setSegmentAddOpen}
        activeGymId={activeGymId}
        libraries={libraries}
        defaultLib={defaultLibId}
        displayOrder={wods.length}
        currentDateKey={dateKey}
        currentDayWods={wods}
        onAdd={addWod}
        onAddBuyInMainCashOut={addBuyInMainCashOut}
      />

      {movementPicker && (
        <MovementPickerDialog
          open
          onOpenChange={(o) => !o && setMovementPicker(null)}
          programmingSegment={wods[movementPicker.wodIdx]?.programming_segment ?? "metcon"}
          onPick={(pick) => {
            addLineItem(movementPicker.wodIdx, pick);
            setMovementPicker(null);
          }}
        />
      )}

      <ComplexSetEditor
        open={complexEditor != null}
        onOpenChange={(o) => !o && setComplexEditor(null)}
        catalog={strengthCatalog}
        onSave={(items) => {
          if (complexEditor) addComplexItems(complexEditor.wodIdx, items);
          setComplexEditor(null);
        }}
      />

      {/* Quick intake — collapsed by default */}
      <div className="border-t border-border/60 pt-6">
        <button
          type="button"
          className="mb-3 flex items-center gap-1.5 text-left"
          onClick={() => setShowQuickIntake((v) => !v)}
          aria-expanded={showQuickIntake}
        >
          {showQuickIntake ? (
            <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="eyebrow">Quick intake (optional)</span>
        </button>
        {showQuickIntake && (
          <WodIntakePanel
            date={date}
            defaultLib={defaultLibId}
            displayOrder={wods.length}
            onCommitted={() => {
              setServerSyncMode("date");
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}
