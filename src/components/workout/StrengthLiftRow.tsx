import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Flame, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  computeWeightFromPr,
  percentRepMaxLabel,
} from "@/lib/programming/percent-calculator";
import { useSavePerformance } from "@/hooks/useSavePerformance";
import type { WorkoutScale } from "@/lib/format";
import type { LogLineItem, LogWodContext, ExistingPerformance } from "@/components/rx/LogScoreSheet";

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
  const { save, submitting } = useSavePerformance();

  const prescribedFromPr = useMemo(
    () => computeWeightFromPr(prWeight, item.prescribed_percentage),
    [prWeight, item.prescribed_percentage],
  );

  const prescribedWeight =
    item.prescribed_weight != null ? item.prescribed_weight : prescribedFromPr;

  const repMaxLabel = percentRepMaxLabel(repCount);

  useEffect(() => {
    if (!contactId || !item.benchmark_definition_id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("athlete_benchmark_summary")
        .select("current_pr_weight, benchmark_definition_id")
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
    if (!item.benchmark_definition_id) {
      setRepCount(1);
      return;
    }
    supabase
      .from("benchmark_definition")
      .select("rep_count")
      .eq("id", item.benchmark_definition_id)
      .maybeSingle()
      .then(({ data }) => setRepCount(data?.rep_count ?? 1));
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

    let isPr = existing?.is_pr ?? false;
    if (item.benchmark_definition_id && status === "completed") {
      const { data: bench } = await supabase
        .from("athlete_benchmark_summary")
        .select("id, current_pr_weight")
        .eq("contact_id", contactId)
        .eq("benchmark_definition_id", item.benchmark_definition_id)
        .maybeSingle();
      if (!bench || (bench.current_pr_weight ?? 0) < weightNum) {
        isPr = true;
        const today = new Date().toISOString().slice(0, 10);
        if (bench) {
          await supabase
            .from("athlete_benchmark_summary")
            .update({ current_pr_weight: weightNum, date_pr_achieved: today })
            .eq("id", bench.id);
        } else {
          await supabase.from("athlete_benchmark_summary").insert({
            contact_id: contactId,
            benchmark_definition_id: item.benchmark_definition_id,
            current_pr_weight: weightNum,
            date_pr_achieved: today,
          });
        }
      }
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
      isPr,
      status,
      workoutScale: (wod.prescribed_scale as WorkoutScale | null) ?? "rx",
      isMetcon: false,
    });

    if (error) {
      toast.error("Couldn't save", { description: error });
      return;
    }
    if (isPr && !existing?.is_pr) toast.success("New PR!");
    else toast.success(status === "completed" ? "Lift logged" : "Marked failed");
    onLogged?.();
  }

  const isLogged = !!existing;
  const pctLabel =
    item.prescribed_percentage != null
      ? `${Math.round(item.prescribed_percentage * 100)}%`
      : null;

  return (
    <div
      className={cn(
        "space-y-3 p-4",
        isLogged && "bg-primary/[0.04]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono-num inline-grid h-8 w-8 place-items-center rounded-md bg-secondary text-xs font-bold text-muted-foreground">
          {item.sequence_number ?? "·"}
        </span>
        <p className="text-sm font-semibold">{item.bench_name ?? "Lift"}</p>
        {item.reps_prescribed != null && (
          <Badge variant="outline" className="font-mono-num text-[10px]">
            {item.reps_prescribed} reps
          </Badge>
        )}
        {pctLabel && (
          <Badge variant="outline" className="font-mono-num text-[10px]">
            {pctLabel} {repMaxLabel}
          </Badge>
        )}
        {existing?.is_pr && (
          <Badge className="gap-1 bg-accent text-accent-foreground">
            <Flame className="h-3 w-3" /> PR
          </Badge>
        )}
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
          onClick={() => submitLift("completed")}
        >
          <CheckCircle2 className="mr-1 h-4 w-4" />
          {isLogged && existing?.status !== "failed" ? "Update · Success" : "Success"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={submitting}
          onClick={() => submitLift("failed")}
        >
          <XCircle className="mr-1 h-4 w-4" />
          Failed
        </Button>
      </div>
    </div>
  );
}
