import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useProgramLibraries } from "@/hooks/useProgramLibraries";
import {
  fetchProgrammingDayForCopy,
  useStaffProgrammingDay,
} from "@/hooks/staff/useStaffProgrammingDay";
import { useProgrammingSave } from "@/hooks/staff/useProgrammingSave";
import { METCON_FORMATS, PROGRAMMING_SEGMENTS } from "@/hooks/staff/programmingEditor";
import type { BenchmarkTypeOption, EditorLineItem, EditorWod } from "@/hooks/staff/types";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Trash2,
  Search,
  Sparkles,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StaffProgramming() {
  const { activeGymId } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [wods, setWods] = useState<EditorWod[]>([]);
  const [defaultLib, setDefaultLib] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
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
  const { saveAll, busy: saving } = useProgrammingSave(activeGymId, date, defaultLib);

  useEffect(() => {
    setDirty(false);
    setWods([]);
  }, [activeGymId, dateKey]);

  useEffect(() => {
    setDefaultLib(null);
  }, [activeGymId]);

  useEffect(() => {
    if (!isLoading && !dirty) setWods(serverWods);
  }, [serverWods, isLoading, dirty]);

  useEffect(() => {
    if (libraries.length && !defaultLib) setDefaultLib(libraries[0].id);
  }, [libraries, defaultLib]);

  function markDirty() {
    setDirty(true);
  }

  function addEmptyWod() {
    markDirty();
    setWods((prev) => [
      ...prev,
      {
        _new: true,
        name: "New segment",
        description: "",
        programming_segment: "metcon",
        metcon_format: null,
        athlete_notes: null,
        coaches_notes: null,
        display_order: prev.length,
        program_library_id: defaultLib,
        items: [],
      },
    ]);
  }

  function updateWod(idx: number, patch: Partial<EditorWod>) {
    markDirty();
    setWods((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }

  function removeWod(idx: number) {
    markDirty();
    setWods((prev) => prev.filter((_, i) => i !== idx));
  }

  function addLineItem(wodIdx: number, bench: BenchmarkTypeOption) {
    markDirty();
    setWods((prev) =>
      prev.map((w, i) =>
        i === wodIdx
          ? {
              ...w,
              items: [
                ...w.items,
                {
                  _new: true,
                  sequence_number: w.items.length + 1,
                  reps_prescribed: null,
                  prescribed_weight: null,
                  prescribed_percentage: null,
                  prescribed_score: null,
                  benchmark_type_id: bench.id,
                  bench_name: bench.name,
                },
              ],
            }
          : w,
      ),
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
        i === wodIdx
          ? { ...w, items: w.items.filter((_, j) => j !== itemIdx) }
          : w,
      ),
    );
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
      const newWods: EditorWod[] = copied.map((w, idx) => ({
        ...w,
        _new: true,
        display_order: baseOrder + idx,
        program_library_id: w.program_library_id ?? defaultLib,
      }));
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
    const { error: saveError, wods: savedWods } = await saveAll(wods);
    setWods(savedWods);
    if (saveError) {
      toast.error("Couldn't save", { description: saveError });
      return;
    }
    toast.success("Saved");
    setDirty(false);
    refetch();
  }

  const busy = saving || copyBusy;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Programmer</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Programming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build the day. Duplicate yesterday, snap in a movement, ship it.
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      {/* Week strip */}
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

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-muted-foreground" />
          <Select value={defaultLib ?? ""} onValueChange={(v) => setDefaultLib(v)}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="Program library" />
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
          <Button onClick={addEmptyWod} size="sm" variant="secondary">
            <Plus className="mr-1 h-3.5 w-3.5" /> Segment
          </Button>
          <Button
            onClick={handleSave}
            disabled={busy || !wods.length}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="mr-1 h-3.5 w-3.5" /> {saving ? "Saving…" : "Save day"}
          </Button>
        </div>
      </div>

      {/* WODs */}
      {isLoading && <PageSkeleton rows={4} />}
      {!isLoading && !error && isEmpty && wods.length === 0 && (
        <EmptyState
          title="Nothing scheduled"
          description={`${format(date, "EEE, MMM d")} is empty. Copy a previous day or add a segment.`}
        />
      )}
      {!isLoading && wods.length > 0 && (
        <div className="space-y-4">
          {wods.map((w, idx) => (
            <Card key={w.id ?? `new-${idx}`} className="glass-card overflow-hidden p-0">
              <div className="space-y-3 border-b border-border/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={w.programming_segment}
                    onValueChange={(v) =>
                      updateWod(idx, {
                        programming_segment: v,
                        metcon_format: v === "metcon" ? w.metcon_format : null,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMMING_SEGMENTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {w.programming_segment === "metcon" && (
                    <Select
                      value={w.metcon_format ?? ""}
                      onValueChange={(v) => updateWod(idx, { metcon_format: v || null })}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue placeholder="format" />
                      </SelectTrigger>
                      <SelectContent>
                        {METCON_FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    value={w.name ?? ""}
                    onChange={(e) => updateWod(idx, { name: e.target.value })}
                    placeholder="Segment name"
                    className="h-8 max-w-xs flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeWod(idx)}
                    aria-label="Remove segment"
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={w.description ?? ""}
                  onChange={(e) => updateWod(idx, { description: e.target.value })}
                  placeholder="Workout description (e.g. AMRAP 12: 10 thrusters, 15 pull-ups)…"
                  rows={3}
                  className="text-sm"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Coach's notes
                    </Label>
                    <Textarea
                      value={w.coaches_notes ?? ""}
                      onChange={(e) => updateWod(idx, { coaches_notes: e.target.value })}
                      rows={2}
                      placeholder="Cues, demo focus…"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Athlete notes
                    </Label>
                    <Textarea
                      value={w.athlete_notes ?? ""}
                      onChange={(e) => updateWod(idx, { athlete_notes: e.target.value })}
                      rows={2}
                      placeholder="Scaling options, intent…"
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="divide-y divide-border/60">
                {w.items.length === 0 && (
                  <p className="px-4 py-3 text-xs italic text-muted-foreground">
                    No prescribed movements. Add one below.
                  </p>
                )}
                {w.items.map((it, j) => (
                  <div key={it.id ?? `i-${j}`} className="space-y-2 p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num inline-grid h-6 w-6 place-items-center rounded-md bg-secondary text-[11px] font-bold text-muted-foreground">
                        {j + 1}
                      </span>
                      <p className="flex-1 text-sm font-bold">{it.bench_name ?? "Movement"}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(idx, j)}
                        aria-label="Remove movement"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-8 md:grid-cols-4">
                      <NumInput
                        label="reps"
                        value={it.reps_prescribed}
                        onChange={(v) => updateItem(idx, j, { reps_prescribed: v })}
                      />
                      <NumInput
                        label="weight (lb)"
                        value={it.prescribed_weight}
                        onChange={(v) => updateItem(idx, j, { prescribed_weight: v })}
                      />
                      <NumInput
                        label="% 1RM"
                        value={it.prescribed_percentage != null ? it.prescribed_percentage * 100 : null}
                        onChange={(v) =>
                          updateItem(idx, j, { prescribed_percentage: v != null ? v / 100 : null })
                        }
                      />
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          score
                        </Label>
                        <Input
                          value={it.prescribed_score ?? ""}
                          onChange={(e) =>
                            updateItem(idx, j, { prescribed_score: e.target.value || null })
                          }
                          className="h-8 font-mono-num text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-3">
                  <Button
                    onClick={() => setMovementPicker({ wodIdx: idx })}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add movement
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CopyFromDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        onPick={(d) => copyFromDate(d)}
      />

      <MovementPicker
        open={!!movementPicker}
        onOpenChange={(o) => !o && setMovementPicker(null)}
        onPick={(b) => {
          if (movementPicker) addLineItem(movementPicker.wodIdx, b);
          setMovementPicker(null);
        }}
      />
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        className="h-8 font-mono-num text-xs"
      />
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

function MovementPicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (b: BenchmarkTypeOption) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<BenchmarkTypeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const query = supabase
        .from("benchmark_type")
        .select("id, name, stimulus")
        .order("name")
        .limit(40);
      if (q) query.ilike("name", `%${q}%`);
      const { data } = await query;
      if (!cancelled) {
        setResults((data ?? []) as BenchmarkTypeOption[]);
        setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Pick a movement</DialogTitle>
          <DialogDescription>
            From the gym's movement library. We'll auto-link reps so PRs track correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search e.g. deadlift, snatch, Fran…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {loading && <Skeleton className="h-10 w-full" />}
          {!loading &&
            results.map((b) => (
              <button
                key={b.id}
                onClick={() => onPick(b)}
                className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span className="font-medium">{b.name}</span>
                {b.stimulus && (
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {b.stimulus}
                  </Badge>
                )}
              </button>
            ))}
          {!loading && !results.length && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No matches.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
