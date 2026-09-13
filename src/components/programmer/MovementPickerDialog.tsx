import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { BenchmarkTypeOption } from "@/hooks/staff/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterBenchmarkCatalog, isMetconSegment, supportsDbKbLoadModality } from "@/lib/programming/manual-config";
import { percentFractionFromWhole } from "@/lib/programming/percent-calculator";
import {
  PRESCRIPTION_UNITS,
  PRESCRIPTION_UNIT_LABELS,
  type PrescriptionUnit,
} from "@/lib/programming/prescription-unit";
import { ensureLoadUnit, type LoadModality } from "@/lib/programming/rx-variants-schema";
import { ensureGymBenchmarkType } from "@/lib/programming/gym-benchmark-type";
import { toast } from "sonner";
import { DurationSecondsInput } from "@/components/programmer/DurationSecondsInput";

export type MovementPrescription = {
  sets: number;
  reps: number | null;
  prescriptionUnit: PrescriptionUnit;
  /** Stored fraction 0–1; strength / weightlifting only */
  prescribedPercentage: number | null;
  /** Metcon: optional male / female loads (e.g. 95 / 65) */
  maleLoadLabel: string | null;
  femaleLoadLabel: string | null;
  /** DB/KB: single vs double (athlete sees 50s when double) */
  loadModality: LoadModality | null;
};

export type MovementPick =
  | ({ kind: "catalog"; bench: BenchmarkTypeOption } & MovementPrescription)
  | ({ kind: "new"; label: string } & MovementPrescription);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmingSegment: string;
  gymId: string | null;
  onPick: (pick: MovementPick) => void;
};

/** Suggest meters for monostructural cardio; otherwise reps. */
export function suggestPrescriptionUnit(movementName: string): PrescriptionUnit {
  const n = movementName.trim().toLowerCase();
  if (
    /\b(run|row|bike|ski|swim|walk|echo|assault|erg|c2|concept\s*2|airbike|fan\s*bike)\b/.test(n)
  ) {
    return "meters";
  }
  return "reps";
}

export function MovementPickerDialog({
  open,
  onOpenChange,
  programmingSegment,
  gymId,
  onPick,
}: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<BenchmarkTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMode, setNewMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState<number | null>(null);
  const [unit, setUnit] = useState<PrescriptionUnit>("reps");
  const [pctWhole, setPctWhole] = useState<number | null>(null);
  const [maleLoad, setMaleLoad] = useState("");
  const [femaleLoad, setFemaleLoad] = useState("");
  const [loadModality, setLoadModality] = useState<LoadModality | null>(null);
  const [pending, setPending] = useState<
    { kind: "catalog"; bench: BenchmarkTypeOption } | { kind: "new"; label: string } | null
  >(null);
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setQ("");
      setNewMode(false);
      setNewLabel("");
      setSets(1);
      setReps(null);
      setUnit("reps");
      setPctWhole(null);
      setMaleLoad("");
      setFemaleLoad("");
      setLoadModality(null);
      setPending(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const query = supabase
        .from("benchmark_type")
        .select("id, name, stimulus, sub_stimulus, purpose_variation, gym_id")
        .order("name")
        .limit(80);
      if (q) query.ilike("name", `%${q}%`);
      const { data } = await query;
      if (!cancelled) {
        const rows = (data ?? []) as BenchmarkTypeOption[];
        setResults(filterBenchmarkCatalog(rows, programmingSegment) as BenchmarkTypeOption[]);
        setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, q, programmingSegment]);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    if (!lower) return results;
    return results.filter((r) => r.name.toLowerCase().includes(lower));
  }, [results, q]);

  const metcon = isMetconSegment(programmingSegment);
  const pendingStimulus =
    pending?.kind === "catalog" ? pending.bench.stimulus : null;
  const pendingPurpose =
    pending?.kind === "catalog" ? pending.bench.purpose_variation : null;
  const showDbKb =
    !metcon ||
    supportsDbKbLoadModality({
      stimulus: pendingStimulus,
      purpose_variation: pendingPurpose,
      programmingSegment,
    });

  function prescription(): MovementPrescription {
    const male = metcon ? ensureLoadUnit(maleLoad) : null;
    const female = metcon ? ensureLoadUnit(femaleLoad) : null;
    return {
      // Metcon movements are listed once in the workout; Sets only applies to strength.
      sets: metcon ? 1 : Math.max(1, sets || 1),
      reps,
      prescriptionUnit: unit,
      prescribedPercentage: metcon ? null : percentFractionFromWhole(pctWhole),
      maleLoadLabel: male ?? female,
      femaleLoadLabel: female ?? male,
      loadModality: showDbKb ? loadModality : null,
    };
  }

  async function confirmPending() {
    if (!pending) return;
    const rx = prescription();
    if (pending.kind === "catalog") {
      onPick({ ...pending, ...rx });
      onOpenChange(false);
      return;
    }
    if (!gymId) {
      toast.error("Select a gym before adding a custom movement");
      return;
    }
    setCommitting(true);
    try {
      const bench = await ensureGymBenchmarkType(gymId, pending.label, programmingSegment);
      onPick({ kind: "catalog", bench, ...rx });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save movement to gym library");
    } finally {
      setCommitting(false);
    }
  }

  function selectCatalog(bench: BenchmarkTypeOption) {
    setPending({ kind: "catalog", bench });
    setUnit(suggestPrescriptionUnit(bench.name));
  }

  function confirmNew() {
    const label = newLabel.trim();
    if (!label) return;
    setPending({ kind: "new", label });
    setUnit(suggestPrescriptionUnit(label));
    setNewMode(false);
  }

  const pendingName =
    pending?.kind === "catalog" ? pending.bench.name : pending?.kind === "new" ? pending.label : null;

  const amountLabel =
    unit === "meters"
      ? "Meters"
      : unit === "calories"
        ? "Calories"
        : unit === "feet"
          ? "Feet"
          : unit === "seconds"
            ? "Time"
            : "Reps";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Add movement</DialogTitle>
          <DialogDescription>
            {metcon
              ? "Pick a movement, then set amount (or time), unit, and optional male/female load."
              : "Pick a movement, then set sets, amount (or time), unit, and optional % before adding."}{" "}
            Use time (m:ss) for pieces like Ski / Row / Bike for 0:60.
          </DialogDescription>
        </DialogHeader>

        {!pending && (
          <>
            <button
              type="button"
              onClick={() => setNewMode((v) => !v)}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-left text-sm transition-colors hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold">New movement</span>
              <span className="text-xs text-muted-foreground">(saves to this gym&apos;s library)</span>
            </button>

            {newMode && (
              <div className="space-y-2 rounded-md border border-border/60 p-3">
                <Label className="text-xs">Movement name</Label>
                <Input
                  autoFocus
                  placeholder="e.g. Tempo KB swing"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
                <Button size="sm" onClick={confirmNew} disabled={!newLabel.trim()}>
                  Continue
                </Button>
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search movements…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {loading && <Skeleton className="h-10 w-full" />}
              {!loading &&
                filtered.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectCatalog(b)}
                    className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm transition-colors hover:bg-secondary"
                  >
                    <span className="font-medium">{b.name}</span>
                    <span className="flex items-center gap-1">
                      {b.gym_id && (
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          Gym
                        </Badge>
                      )}
                      {b.stimulus && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {b.stimulus}
                        </Badge>
                      )}
                    </span>
                  </button>
                ))}
              {!loading && !filtered.length && (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">No matches.</p>
              )}
            </div>
          </>
        )}

        {pending && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Movement
                </p>
                <p className="text-sm font-semibold">{pendingName}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setPending(null)}>
                Change
              </Button>
            </div>
            <div className={metcon ? "grid grid-cols-2 gap-3 sm:grid-cols-3" : "grid grid-cols-2 gap-3 sm:grid-cols-4"}>
              {!metcon && (
                <div className="space-y-1">
                  <Label className="text-xs">Sets</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 font-mono-num"
                    value={sets}
                    onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <p className="text-[10px] text-muted-foreground">One row per set</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">{amountLabel}</Label>
                {unit === "seconds" ? (
                  <DurationSecondsInput
                    value={reps}
                    onChange={setReps}
                    className="h-8 font-mono-num"
                    placeholder="0:60"
                    inputKey={`pick-sec-${reps ?? "x"}`}
                  />
                ) : (
                  <Input
                    type="number"
                    min={1}
                    className="h-8 font-mono-num"
                    value={reps ?? ""}
                    onChange={(e) =>
                      setReps(
                        e.target.value === "" ? null : Math.max(1, Number(e.target.value) || 1),
                      )
                    }
                    placeholder="—"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as PrescriptionUnit)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESCRIPTION_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {PRESCRIPTION_UNIT_LABELS[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!metcon && (
                <div className="space-y-1">
                  <Label className="text-xs">% (optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="h-8 font-mono-num"
                    value={pctWhole ?? ""}
                    onChange={(e) =>
                      setPctWhole(e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="e.g. 75"
                  />
                </div>
              )}
            </div>
            {metcon && (
              <div className="space-y-2 rounded-md border border-dashed border-border/70 bg-muted/20 p-3">
                {showDbKb && (
                  <div className="space-y-1">
                    <Label className="text-xs">DB / KB implement</Label>
                    <Select
                      value={loadModality ?? "unset"}
                      onValueChange={(v) =>
                        setLoadModality(v === "unset" ? null : (v as LoadModality))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Not set (barbell / other)</SelectItem>
                        <SelectItem value="single">Single dumbbell / kettlebell</SelectItem>
                        <SelectItem value="double">Double dumbbells / kettlebells</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Load (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {showDbKb && loadModality === "double" ? "Male each" : "Male load"}
                    </Label>
                    <div className="flex h-8 items-center overflow-hidden rounded-md border border-input bg-background">
                      <Input
                        value={maleLoad}
                        onChange={(e) => setMaleLoad(e.target.value)}
                        placeholder={
                          showDbKb && loadModality === "double" ? "e.g. 50" : "e.g. 95"
                        }
                        className="h-8 border-0 font-mono-num text-xs shadow-none focus-visible:ring-0"
                      />
                      <span className="shrink-0 border-l border-border/60 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        lbs
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {showDbKb && loadModality === "double" ? "Female each" : "Female load"}
                    </Label>
                    <div className="flex h-8 items-center overflow-hidden rounded-md border border-input bg-background">
                      <Input
                        value={femaleLoad}
                        onChange={(e) => setFemaleLoad(e.target.value)}
                        placeholder={
                          showDbKb && loadModality === "double" ? "e.g. 35" : "e.g. 65"
                        }
                        className="h-8 border-0 font-mono-num text-xs shadow-none focus-visible:ring-0"
                      />
                      <span className="shrink-0 border-l border-border/60 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        lbs
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {showDbKb && loadModality === "double"
                    ? "Athletes see 50s/35s. Enter one DB/KB weight, not the pair total."
                    : "For weighted movements (thrusters, wall balls, DBs). Leave blank for bodyweight."}
                </p>
              </div>
            )}
            {!metcon && (
              <p className="text-[10px] text-muted-foreground">
                Optional % of PR applies to strength and weightlifting sets.
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPending} disabled={committing}>
                {committing
                  ? "Saving…"
                  : metcon
                    ? "Add movement"
                    : `Add ${sets > 1 ? `${sets} sets` : "movement"}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
