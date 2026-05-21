import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useProgramLibraries } from "@/hooks/useProgramLibraries";
import {
  fetchProgrammingDayForCopy,
  useStaffProgrammingDay,
} from "@/hooks/staff/useStaffProgrammingDay";
import { useProgrammingSave } from "@/hooks/staff/useProgrammingSave";
import { useProgrammingPublish } from "@/hooks/staff/useProgrammingPublish";
import type { EditorLineItem, EditorWod } from "@/hooks/staff/types";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Save,
  Sparkles,
  Library,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WodIntakePanel } from "@/components/programmer/WodIntakePanel";
import { SegmentAddDialog } from "@/components/programmer/SegmentAddDialog";
import { SegmentEditorCard } from "@/components/programmer/SegmentEditorCard";
import {
  MovementPickerDialog,
  type MovementPick,
} from "@/components/programmer/MovementPickerDialog";

export default function StaffProgramming() {
  const { activeGymId } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [wods, setWods] = useState<EditorWod[]>([]);
  const [viewTrackId, setViewTrackId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [segmentAddOpen, setSegmentAddOpen] = useState(false);
  const [movementPicker, setMovementPicker] = useState<{ wodIdx: number } | null>(null);

  const dateKey = format(date, "yyyy-MM-dd");
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const {
    data: serverWods,
    isLoading,
    error,
    isEmpty,
    refetch,
  } = useStaffProgrammingDay(activeGymId, date);
  const { data: libraries } = useProgramLibraries(activeGymId);
  const { saveAll, busy: saving } = useProgrammingSave(activeGymId, date, viewTrackId);
  const { publishDay, publishWeek, busy: publishing } = useProgrammingPublish(activeGymId);

  const visibleWods = useMemo(() => {
    if (!viewTrackId) return wods;
    return wods.filter((w) => {
      const ids = w.program_library_ids?.length
        ? w.program_library_ids
        : w.program_library_id
          ? [w.program_library_id]
          : [];
      return ids.includes(viewTrackId);
    });
  }, [wods, viewTrackId]);

  useEffect(() => {
    setDirty(false);
  }, [dateKey]);

  useEffect(() => {
    if (!isLoading && !dirty) setWods(serverWods);
  }, [serverWods, isLoading, dirty]);

  useEffect(() => {
    if (libraries.length && !viewTrackId) setViewTrackId(libraries[0].id);
  }, [libraries, viewTrackId]);

  function markDirty() {
    setDirty(true);
  }

  function addWod(wod: EditorWod) {
    markDirty();
    setWods((prev) => [...prev, wod]);
  }

  function updateWod(idx: number, patch: Partial<EditorWod>) {
    markDirty();
    setWods((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }

  function removeWod(idx: number) {
    markDirty();
    setWods((prev) => prev.filter((_, i) => i !== idx));
  }

  function addLineItem(wodIdx: number, pick: MovementPick) {
    markDirty();
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
              }
            : {
                ...base,
                benchmark_type_id: null,
                bench_name: pick.label,
                movement_label: pick.label,
              };
        return { ...w, items: [...w.items, item] };
      }),
    );
  }

  function updateItem(wodIdx: number, itemIdx: number, patch: Partial<EditorLineItem>) {
    markDirty();
    setWods((prev) =>
      prev.map((w, i) =>
        i === wodIdx
          ? { ...w, items: w.items.map((it, j) => (j === itemIdx ? { ...it, ...patch } : it)) }
          : w,
      ),
    );
  }

  function removeItem(wodIdx: number, itemIdx: number) {
    markDirty();
    setWods((prev) =>
      prev.map((w, i) =>
        i === wodIdx ? { ...w, items: w.items.filter((_, j) => j !== itemIdx) } : w,
      ),
    );
  }

  function cloneItem(wodIdx: number, itemIdx: number) {
    markDirty();
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

  async function handlePublishDay() {
    const { error, count } = await publishDay(date);
    if (error) {
      toast.error("Couldn't publish", { description: error });
      return;
    }
    toast.success(
      count > 0 ? `Published ${count} segment${count === 1 ? "" : "s"} for this day` : "Nothing new to publish for this day",
    );
    refetch();
  }

  async function handlePublishWeek() {
    const { error, count } = await publishWeek(weekStart);
    if (error) {
      toast.error("Couldn't publish", { description: error });
      return;
    }
    toast.success(
      count > 0 ? `Published ${count} segment${count === 1 ? "" : "s"} this week` : "Nothing new to publish this week",
    );
    refetch();
  }

  async function copyFromDate(source: Date) {
    if (!activeGymId) return;
    setCopyBusy(true);
    try {
      const copied = await fetchProgrammingDayForCopy(activeGymId, source);
      if (!copied.length) {
        toast.error("No programming on that date to copy.");
        return;
      }
      const baseOrder = wods.length;
      const newWods: EditorWod[] = copied.map((w, idx) => {
        const ids =
          w.program_library_ids?.length > 0
            ? w.program_library_ids
            : viewTrackId
              ? [viewTrackId]
              : [];
        return {
          ...w,
          _new: true,
          display_order: baseOrder + idx,
          program_library_ids: ids,
          program_library_id: ids[0] ?? w.program_library_id ?? viewTrackId,
        };
      });
      setWods((prev) => [...prev, ...newWods]);
      markDirty();
      setCopyOpen(false);
      toast.success(
        `Copied ${copied.length} segment${copied.length === 1 ? "" : "s"} from ${format(source, "MMM d")}`,
      );
    } catch (e) {
      toast.error("Couldn't copy", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setCopyBusy(false);
    }
  }

  async function handleSave() {
    const { error: saveError } = await saveAll(wods);
    if (saveError) {
      toast.error("Couldn't save", { description: saveError });
      return;
    }
    toast.success("Saved");
    setDirty(false);
    refetch();
  }

  const busy = saving || copyBusy || publishing;

  function wodGlobalIndex(wod: EditorWod): number {
    return wods.findIndex((w) => w === wod);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Programmer</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Programming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add segments with type-specific movements, publish to one or more tracks, then save.
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <WodIntakePanel
        date={date}
        defaultLib={viewTrackId}
        displayOrder={wods.length}
        onCommitted={() => {
          setDirty(false);
          refetch();
        }}
      />

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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-muted-foreground" />
          <Select value={viewTrackId ?? ""} onValueChange={(v) => setViewTrackId(v)}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="View track" />
            </SelectTrigger>
            <SelectContent>
              {libraries.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => copyFromDate(addDays(date, -1))} disabled={busy}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Copy yesterday
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyFromDate(addDays(date, -7))} disabled={busy}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Last week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Copy from…
          </Button>
          <Button onClick={() => setSegmentAddOpen(true)} size="sm" variant="secondary">
            <Plus className="mr-1 h-3.5 w-3.5" /> Segment
          </Button>
          <Button
            onClick={handleSave}
            disabled={busy || !wods.length}
            size="sm"
            variant="secondary"
          >
            <Save className="mr-1 h-3.5 w-3.5" /> {saving ? "Saving…" : "Save day"}
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
      </div>

      {isLoading && <PageSkeleton rows={4} />}
      {!isLoading && !error && isEmpty && wods.length === 0 && (
        <EmptyState
          title="Nothing scheduled"
          description={`${format(date, "EEE, MMM d")} is empty. Copy a previous day or add a segment.`}
        />
      )}
      {!isLoading && visibleWods.length > 0 && (
        <div className="space-y-4">
          {visibleWods.map((w) => {
            const idx = wodGlobalIndex(w);
            return (
              <SegmentEditorCard
                key={w.id ?? `new-${idx}`}
                wod={w}
                libraries={libraries}
                onUpdate={(patch) => updateWod(idx, patch)}
                onRemove={() => removeWod(idx)}
                onUpdateItem={(itemIdx, patch) => updateItem(idx, itemIdx, patch)}
                onRemoveItem={(itemIdx) => removeItem(idx, itemIdx)}
                onCloneItem={(itemIdx) => cloneItem(idx, itemIdx)}
                onAddMovement={() => setMovementPicker({ wodIdx: idx })}
              />
            );
          })}
        </div>
      )}
      {!isLoading && wods.length > 0 && visibleWods.length === 0 && (
        <EmptyState
          title="No segments for this track"
          description="Switch view track or add segments published to this library."
        />
      )}

      <CopyFromDialog open={copyOpen} onOpenChange={setCopyOpen} onPick={(d) => copyFromDate(d)} />

      <SegmentAddDialog
        open={segmentAddOpen}
        onOpenChange={setSegmentAddOpen}
        activeGymId={activeGymId}
        libraries={libraries}
        defaultLib={viewTrackId}
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
    </div>
  );
}

function CopyFromDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (d: Date) => void;
}) {
  const [val, setVal] = useState<string>(format(addDays(new Date(), -1), "yyyy-MM-dd"));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Copy programming from…</DialogTitle>
          <DialogDescription>Pick any date with programming on it.</DialogDescription>
        </DialogHeader>
        <Input type="date" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button
          onClick={() => onPick(new Date(val + "T00:00:00"))}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Copy className="mr-2 h-4 w-4" /> Copy this day
        </Button>
      </DialogContent>
    </Dialog>
  );
}
