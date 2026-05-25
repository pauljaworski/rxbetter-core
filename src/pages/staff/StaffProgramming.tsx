import { useEffect, useMemo, useState } from "react";
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
import {
  MovementPickerDialog,
  type MovementPick,
} from "@/components/programmer/MovementPickerDialog";

export default function StaffProgramming() {
  const { activeGymId } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [wods, setWods] = useState<EditorWod[]>([]);
  const [syncFromServer, setSyncFromServer] = useState(true);
  const [segmentAddOpen, setSegmentAddOpen] = useState(false);
  const [movementPicker, setMovementPicker] = useState<{ wodIdx: number } | null>(null);
  const [complexEditor, setComplexEditor] = useState<{ wodIdx: number } | null>(null);
  const { data: benchmarkCatalog } = useBenchmarkCatalog();
  const strengthCatalog = useMemo(
    () => filterBenchmarkCatalog(benchmarkCatalog, "weightlifting"),
    [benchmarkCatalog],
  );
  const [savingSectionIdx, setSavingSectionIdx] = useState<number | null>(null);
  const [stashedDrafts, setStashedDrafts] = useState<EditorWod[]>([]);

  const dateKey = format(date, "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const {
    data: serverWods,
    isLoading,
    error,
    isEmpty,
    refetch,
  } = useStaffProgrammingDay(activeGymId, date);
  const { data: libraries } = useProgramLibraries(activeGymId);
  const defaultLibId = libraries[0]?.id ?? null;
  const { saveWod, busy: saving } = useProgrammingSave(activeGymId, date, defaultLibId);
  const { publishDay, publishWeek, busy: publishing } = useProgrammingPublish(activeGymId);

  useEffect(() => {
    setSyncFromServer(true);
    setStashedDrafts([]);
  }, [dateKey]);

  useEffect(() => {
    if (!isLoading && syncFromServer) {
      setWods([...serverWods, ...stashedDrafts]);
      setStashedDrafts([]);
      setSyncFromServer(false);
    }
  }, [serverWods, isLoading, syncFromServer, stashedDrafts]);

  function addWod(wod: EditorWod) {
    setSyncFromServer(false);
    setWods((prev) => [...prev, wod]);
  }

  function updateWod(idx: number, patch: Partial<EditorWod>) {
    setSyncFromServer(false);
    setWods((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }

  function removeWod(idx: number) {
    setSyncFromServer(false);
    setWods((prev) => prev.filter((_, i) => i !== idx));
  }

  function addLineItem(wodIdx: number, pick: MovementPick) {
    setSyncFromServer(false);
    setWods((prev) =>
      prev.map((w, i) => {
        if (i !== wodIdx) return w;
        const base = {
          _new: true as const,
          sequence_number: w.items.length + 1,
          reps_prescribed: null,
          prescribed_weight: null,
          prescribed_percentage: null,
          prescribed_score: null,
        };
        const item: EditorLineItem =
          pick.kind === "catalog"
            ? {
                ...base,
                benchmark_type_id: pick.bench.id,
                bench_name: pick.bench.name,
                movement_label: null,
                percent_rep_max: 1,
                line_item_kind: "strength_set",
                movement_components: [],
              }
            : {
                ...base,
                benchmark_type_id: null,
                bench_name: pick.label,
                movement_label: pick.label,
                line_item_kind: "strength_set",
                movement_components: [],
              };
        return { ...w, items: [...w.items, item] };
      }),
    );
  }

  function updateItem(wodIdx: number, itemIdx: number, patch: Partial<EditorLineItem>) {
    setSyncFromServer(false);
    setWods((prev) =>
      prev.map((w, i) =>
        i === wodIdx
          ? { ...w, items: w.items.map((it, j) => (j === itemIdx ? { ...it, ...patch } : it)) }
          : w,
      ),
    );
  }

  function removeItem(wodIdx: number, itemIdx: number) {
    setSyncFromServer(false);
    setWods((prev) =>
      prev.map((w, i) =>
        i === wodIdx ? { ...w, items: w.items.filter((_, j) => j !== itemIdx) } : w,
      ),
    );
  }

  function addComplexItems(wodIdx: number, items: EditorLineItem[]) {
    setSyncFromServer(false);
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

  function cloneItem(wodIdx: number, itemIdx: number) {
    setSyncFromServer(false);
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

  async function handleSaveSection(idx: number) {
    const wod = wods[idx];
    const lib =
      wod.program_library_ids[0] ?? wod.program_library_id ?? defaultLibId;
    if (!lib) {
      toast.error("Select at least one track for this section.");
      return;
    }

    setSavingSectionIdx(idx);
    const { programmingId, error: saveError } = await saveWod(wod, wod.display_order ?? idx);
    setSavingSectionIdx(null);

    if (saveError) {
      toast.error("Couldn't save section", { description: saveError });
      return;
    }

    toast.success("Section saved");

    setStashedDrafts(wods.filter((w, i) => i !== idx && !w.id));
    setSyncFromServer(true);
    refetch();
  }

  async function handlePublishDay() {
    const { error, count } = await publishDay(date);
    if (error) {
      toast.error("Couldn't publish", { description: error });
      return;
    }
    toast.success(
      count > 0
        ? `Published ${count} segment${count === 1 ? "" : "s"} for this day`
        : "Nothing new to publish for this day",
    );
    setSyncFromServer(true);
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
    setSyncFromServer(true);
    refetch();
  }

  const busy = saving || publishing;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Programmer</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Programming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a day, add segments, save each section, then publish when the day is ready.
        </p>
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
                onClick={() => setDate(d)}
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
          onClick={handlePublishDay}
          disabled={busy}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="mr-1 h-3.5 w-3.5" /> Publish day
        </Button>
        <Button onClick={handlePublishWeek} disabled={busy} size="sm" variant="outline">
          <Send className="mr-1 h-3.5 w-3.5" /> Publish week
        </Button>
      </div>

      {isLoading && <PageSkeleton rows={4} />}
      {!isLoading && !error && isEmpty && wods.length === 0 && (
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
              onRemove={() => removeWod(idx)}
              onSaveSection={() => handleSaveSection(idx)}
              onUpdateItem={(itemIdx, patch) => updateItem(idx, itemIdx, patch)}
              onRemoveItem={(itemIdx) => removeItem(idx, itemIdx)}
              onCloneItem={(itemIdx) => cloneItem(idx, itemIdx)}
              onAddMovement={() => setMovementPicker({ wodIdx: idx })}
              onOpenComplexEditor={() => setComplexEditor({ wodIdx: idx })}
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
        onAdd={addWod}
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

      {/* Quick intake — secondary workflow */}
      <div className="border-t border-border/60 pt-6">
        <p className="eyebrow mb-3">Quick intake (optional)</p>
        <WodIntakePanel
          date={date}
          defaultLib={defaultLibId}
          displayOrder={wods.length}
          onCommitted={() => {
            setSyncFromServer(true);
            refetch();
          }}
        />
      </div>
    </div>
  );
}
