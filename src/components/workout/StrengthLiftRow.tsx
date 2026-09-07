import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Flame, Pencil, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  computeWeightFromPr,
  formatWeightInputDefault,
  roundWeightLb,
} from "@/lib/programming/percent-calculator";
import { loadRepCountForDefinition } from "@/lib/programming/enrich-line-items";
import { recomputeBenchmarkSummary } from "@/lib/pr/record-athlete-pr";
import { useSavePerformance } from "@/hooks/useSavePerformance";
import type { WorkoutScale } from "@/lib/format";
import type { LogLineItem, LogWodContext, ExistingPerformance } from "@/components/rx/LogScoreSheet";
import { AthletePrescriptionHeader } from "@/components/workout/AthletePrescriptionHeader";
import { prescriptionUnitForLineItem } from "@/lib/programming/complex-set-prescription";
import {
  formatComplexMovementTitle,
  parseMovementComponents,
} from "@/lib/programming/movement-components-schema";
import { tryMarkProgrammingSegmentComplete } from "@/lib/programming/segment-completion";
import {
  resolvePrescriptionForAthlete,
  type RxGender,
} from "@/lib/programming/rx-variants-schema";
import { LogAthletePrDialog } from "@/components/workout/LogAthletePrDialog";

function weightToInputValue(lb: number): string {
  if (Number.isInteger(lb)) return String(lb);
  return String(lb);
}

export function StrengthLiftRow({
  item,
  wod,
  contactId,
  rxGender,
  existing,
  onLogged,
}: {
  item: LogLineItem;
  wod: LogWodContext;
  contactId: string | null;
  rxGender?: RxGender | null;
  existing: ExistingPerformance | null;
  onLogged?: () => void;
}) {
  const [prWeight, setPrWeight] = useState<number | null>(null);
  const [repCount, setRepCount] = useState(1);
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [localPerf, setLocalPerf] = useState<ExistingPerformance | null>(existing);
  const [editing, setEditing] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const { save, submitting } = useSavePerformance();

  const displayPerf = localPerf ?? existing;
  const isLogged = displayPerf?.weight_lifted != null || !!displayPerf?.status;
  const readOnly = isLogged && !editing;
  const loggedStatus =
    displayPerf?.status === "failed"
      ? "failed"
      : displayPerf?.status === "completed" || displayPerf?.weight_lifted != null
        ? "completed"
        : null;

  const resolvedRx = useMemo(
    () => resolvePrescriptionForAthlete(item, rxGender ?? null),
    [item, rxGender],
  );

  const prescribedFromPr = useMemo(
    () => computeWeightFromPr(prWeight, item.prescribed_percentage),
    [prWeight, item.prescribed_percentage],
  );

  const prescribedWeight = useMemo(() => {
    const raw =
      resolvedRx.prescribed_weight != null
        ? resolvedRx.prescribed_weight
        : item.prescribed_weight != null
          ? item.prescribed_weight
          : prescribedFromPr;
    return roundWeightLb(raw);
  }, [resolvedRx.prescribed_weight, item.prescribed_weight, prescribedFromPr]);

  const displayPrWeight = roundWeightLb(prWeight);

  const movementName = useMemo(() => {
    const components = parseMovementComponents(item.movement_components);
    if (components.length) return formatComplexMovementTitle(components);
    return item.bench_name ?? "Lift";
  }, [item.bench_name, item.movement_components]);

  const needsPr =
    contactId != null && item.benchmark_definition_id != null && displayPrWeight == null;

  useEffect(() => {
    if (!contactId || !item.benchmark_definition_id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("athlete_benchmark_summary")
        .select("current_pr_weight")
        .eq("contact_id", contactId)
        .eq("benchmark_definition_id", item.benchmark_definition_id)
        .maybeSingle();
      if (!cancelled) setPrWeight(data?.current_pr_weight ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId, item.benchmark_definition_id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rc = await loadRepCountForDefinition(item.benchmark_definition_id);
      if (!cancelled) setRepCount(rc);
    })();
    return () => {
      cancelled = true;
    };
  }, [item.benchmark_definition_id]);

  useEffect(() => {
    setLocalPerf(existing);
    setEditing(false);
  }, [item.id, existing?.id]);

  useEffect(() => {
    if (displayPerf?.weight_lifted != null) {
      setWeight(weightToInputValue(displayPerf.weight_lifted));
    } else if (prescribedWeight != null) {
      setWeight(formatWeightInputDefault(prescribedWeight));
    } else {
      setWeight("");
    }
    setRpe(displayPerf?.rpe != null ? String(displayPerf.rpe) : "");
  }, [item.id, displayPerf?.id, displayPerf?.weight_lifted, prescribedWeight]);

  async function refreshPr() {
    if (!contactId || !item.benchmark_definition_id) return;
    const { data } = await supabase
      .from("athlete_benchmark_summary")
      .select("current_pr_weight")
      .eq("contact_id", contactId)
      .eq("benchmark_definition_id", item.benchmark_definition_id)
      .maybeSingle();
    setPrWeight(data?.current_pr_weight ?? null);
  }

  async function submitLift(status: "completed" | "failed") {
    if (!contactId) {
      toast.error("Sign in to log lifts");
      return;
    }
    const weightNum = weight ? Number(weight) : null;
    if (weightNum == null || Number.isNaN(weightNum)) {
      toast.error("Enter actual weight lifted");
      return;
    }

    const perfId = displayPerf?.id;

    const { error, id: savedId } = await save({
      contactId,
      programmingId: wod.id,
      lineItemId: item.id,
      wodDate: wod.wod_date,
      benchmarkDefinitionId: item.benchmark_definition_id,
      benchmarkTypeId: item.benchmark_type_id,
      repsPrescribed: item.reps_prescribed,
      existingId: perfId,
      score: null,
      weightLifted: weightNum,
      rpe: rpe ? Number(rpe) : null,
      isPr: false,
      status,
      workoutScale:
        wod.prescribed_scale && wod.prescribed_scale !== "na"
          ? (wod.prescribed_scale as WorkoutScale)
          : "rx",
      isMetcon: false,
    });

    if (error) {
      toast.error("Couldn't save", { description: error });
      return;
    }

    let isPr = displayPerf?.is_pr ?? false;
    if (item.benchmark_definition_id && status === "completed") {
      const { error: prErr } = await recomputeBenchmarkSummary(
        contactId,
        item.benchmark_definition_id,
      );
      if (prErr) {
        toast.error("Lift saved but PR vault didn't update", { description: prErr });
      } else {
        await refreshPr();
        const { data: bench } = await supabase
          .from("athlete_benchmark_summary")
          .select("current_pr_weight")
          .eq("contact_id", contactId)
          .eq("benchmark_definition_id", item.benchmark_definition_id)
          .maybeSingle();
        isPr = bench?.current_pr_weight === weightNum;
      }
    }

    setLocalPerf({
      id: savedId ?? perfId ?? "local",
      score: null,
      weight_lifted: weightNum,
      rpe: rpe ? Number(rpe) : null,
      is_pr: isPr,
      workout_scale: (wod.prescribed_scale as WorkoutScale | null) ?? "rx",
      status,
    });
    setEditing(false);

    if (isPr && !displayPerf?.is_pr) toast.success("New PR!");
    else if (status === "failed") toast.message("Lift saved as failed");
    else toast.success(displayPerf ? "Lift updated" : "Lift saved");

    await tryMarkProgrammingSegmentComplete(
      contactId,
      wod.id,
      wod.wod_date,
      wod.programming_segment,
    );

    onLogged?.();
  }

  return (
    <div
      className={cn(
        "space-y-4 border-b border-border/40 p-4 md:p-5 last:border-b-0",
        isLogged &&
          loggedStatus === "completed" &&
          "bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-500/20",
        isLogged &&
          loggedStatus === "failed" &&
          "bg-destructive/[0.06] ring-1 ring-inset ring-destructive/20",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AthletePrescriptionHeader
          movementName={movementName}
          repsPrescribed={resolvedRx.reps_prescribed ?? item.reps_prescribed}
          prescriptionUnit={resolvedRx.prescription_unit ?? prescriptionUnitForLineItem(item)}
          dualAmountLabel={resolvedRx.dual_amount_label}
          dualModifierLabel={resolvedRx.dual_modifier_label}
          loadLabel={resolvedRx.load_label}
          heightLabel={resolvedRx.height_label}
          prescribedScore={resolvedRx.prescribed_score}
          prescribedPercentage={item.prescribed_percentage}
          repMaxCount={repCount}
          prescribedWeight={item.prescribed_weight}
          sequenceNumber={item.sequence_number}
        />
        <div className="flex flex-wrap items-center gap-2">
          {isLogged && loggedStatus === "completed" && (
            <Badge className="gap-1 bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </Badge>
          )}
          {isLogged && loggedStatus === "failed" && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" /> Failed
            </Badge>
          )}
          {displayPerf?.is_pr && (
            <Badge className="gap-1 bg-accent text-accent-foreground">
              <Flame className="h-3 w-3" /> PR
            </Badge>
          )}
          {needsPr && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setPrDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add PR
            </Button>
          )}
        </div>
      </div>

      {readOnly ? (
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border border-border/60 bg-card/80 px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Weight</p>
              <p className="font-mono-num text-xl font-black">
                {displayPerf?.weight_lifted != null ? `${displayPerf.weight_lifted} lb` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">RPE</p>
              <p className="font-mono-num text-xl font-black">
                {displayPerf?.rpe != null ? displayPerf.rpe : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Result</p>
              <p className="text-sm font-semibold">
                {loggedStatus === "failed" ? "Failed" : "Success"}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Your PR (lb)
              </Label>
              <p className="font-mono-num text-lg font-black">
                {displayPrWeight != null ? displayPrWeight : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Prescribed (lb)
              </Label>
              <p className="font-mono-num text-lg font-black text-primary">
                {prescribedWeight != null ? prescribedWeight : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Actual weight (lb)
              </Label>
              <Input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="font-mono-num h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                RPE (optional)
              </Label>
              <Input
                inputMode="decimal"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder="8"
                className="font-mono-num h-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              variant="outline"
              onClick={() => void submitLift("completed")}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Success
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              variant="outline"
              onClick={() => void submitLift("failed")}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Failed
            </Button>
            {editing && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </>
      )}

      <LogAthletePrDialog
        open={prDialogOpen}
        onOpenChange={setPrDialogOpen}
        contactId={contactId}
        benchmarkDefinitionId={item.benchmark_definition_id}
        benchmarkTypeId={item.benchmark_type_id}
        movementName={item.bench_name ?? "Lift"}
        repMaxCount={repCount}
        repsPrescribed={item.reps_prescribed}
        defaultDate={wod.wod_date}
        onSaved={() => {
          void refreshPr();
          onLogged?.();
        }}
      />
    </div>
  );
}
