import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Flame, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { computeWeightFromPr } from "@/lib/programming/percent-calculator";
import { loadRepCountForDefinition } from "@/lib/programming/enrich-line-items";
import { recomputeBenchmarkSummary } from "@/lib/pr/record-athlete-pr";
import { useSavePerformance } from "@/hooks/useSavePerformance";
import type { WorkoutScale } from "@/lib/format";
import type { LogLineItem, LogWodContext, ExistingPerformance } from "@/components/rx/LogScoreSheet";
import { AthletePrescriptionHeader } from "@/components/workout/AthletePrescriptionHeader";
import { LogAthletePrDialog } from "@/components/workout/LogAthletePrDialog";

export function StrengthLiftRow({
  item,
  wod,
  contactId,
  existing,
  onLogged,
}: {
  item: LogLineItem;
  wod: LogWodContext;
  contactId: string | null;
  existing: ExistingPerformance | null;
  onLogged?: () => void;
}) {
  const [prWeight, setPrWeight] = useState<number | null>(null);
  const [repCount, setRepCount] = useState(1);
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const { save, submitting } = useSavePerformance();

  const prescribedFromPr = useMemo(
    () => computeWeightFromPr(prWeight, item.prescribed_percentage),
    [prWeight, item.prescribed_percentage],
  );

  const prescribedWeight =
    item.prescribed_weight != null ? item.prescribed_weight : prescribedFromPr;

  const needsPr = contactId != null && item.benchmark_definition_id != null && prWeight == null;

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
    if (existing?.weight_lifted != null) {
      setWeight(String(existing.weight_lifted));
    } else if (prescribedWeight != null) {
      setWeight(String(prescribedWeight));
    } else {
      setWeight("");
    }
    setRpe(existing?.rpe != null ? String(existing.rpe) : "");
  }, [existing, prescribedWeight]);

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

    const { error } = await save({
      contactId,
      programmingId: wod.id,
      lineItemId: item.id,
      wodDate: wod.wod_date,
      benchmarkDefinitionId: item.benchmark_definition_id,
      benchmarkTypeId: item.benchmark_type_id,
      repsPrescribed: item.reps_prescribed,
      existingId: existing?.id,
      score: null,
      weightLifted: weightNum,
      rpe: rpe ? Number(rpe) : null,
      isPr: false,
      status,
      workoutScale: (wod.prescribed_scale as WorkoutScale | null) ?? "rx",
      isMetcon: false,
    });

    if (error) {
      toast.error("Couldn't save", { description: error });
      return;
    }

    let becamePr = false;
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
        becamePr = bench?.current_pr_weight === weightNum;
      }
    }

    if (becamePr) toast.success("New PR!");
    else toast.success(status === "completed" ? "Lift logged" : "Marked failed");
    onLogged?.();
  }

  const isLogged = !!existing;

  return (
    <div className={cn("space-y-4 p-4 md:p-5", isLogged && "bg-primary/[0.04]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AthletePrescriptionHeader
          movementName={item.bench_name ?? "Lift"}
          repsPrescribed={item.reps_prescribed}
          prescribedPercentage={item.prescribed_percentage}
          repMaxCount={repCount}
          prescribedWeight={item.prescribed_weight}
          sequenceNumber={item.sequence_number}
        />
        <div className="flex flex-wrap items-center gap-2">
          {existing?.is_pr && (
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Your PR (lb)
          </Label>
          <p className="font-mono-num text-lg font-black">
            {prWeight != null ? prWeight : "—"}
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
          size="sm"
          disabled={submitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => void submitLift("completed")}
        >
          <CheckCircle2 className="mr-1 h-4 w-4" />
          {isLogged && existing?.status !== "failed" ? "Update · Success" : "Success"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={submitting}
          onClick={() => void submitLift("failed")}
        >
          <XCircle className="mr-1 h-4 w-4" />
          Failed
        </Button>
      </div>

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
