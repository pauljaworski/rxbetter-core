import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ChevronRight, Flame, Pencil, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WORKOUT_SCALE_OPTIONS, type WorkoutScale } from "@/lib/format";
import { useSavePerformance } from "@/hooks/useSavePerformance";
import { loadRepCountForDefinition } from "@/lib/programming/enrich-line-items";
import { recomputeBenchmarkSummary } from "@/lib/pr/record-athlete-pr";
import { AthletePrescriptionHeader } from "@/components/workout/AthletePrescriptionHeader";

export type LogLineItem = {
  id: string;
  sequence_number: number | null;
  reps_prescribed: number | null;
  prescribed_percentage: number | null;
  prescribed_weight: number | null;
  prescribed_score: string | null;
  status: string | null;
  benchmark_definition_id: string | null;
  benchmark_type_id: string | null;
  bench_name?: string;
  stimulus?: string;
};

export type LogWodContext = {
  id: string;
  name: string | null;
  wod_date: string;
  programming_segment: string | null;
  prescribed_scale?: string | null;
};

export type ExistingPerformance = {
  id: string;
  score: string | null;
  weight_lifted: number | null;
  rpe: number | null;
  is_pr: boolean;
  workout_scale?: string | null;
  status?: string | null;
};

export function LogScoreRow({
  item,
  wod,
  contactId,
  existing,
  onLogged,
}: {
  item: LogLineItem;
  wod: LogWodContext;
  contactId: string | null;
  existing?: ExistingPerformance | null;
  onLogged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [workoutScale, setWorkoutScale] = useState<WorkoutScale | "">("");
  const [liftStatus, setLiftStatus] = useState<"completed" | "failed">("completed");
  const [repCount, setRepCount] = useState(1);
  const { save, removePerformance, submitting } = useSavePerformance();

  const isMetcon = wod.programming_segment === "metcon" || !!item.prescribed_score;
  const isLogged = !!existing;

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
    if (open) {
      setScore(existing?.score ?? "");
      setWeight(existing?.weight_lifted != null ? String(existing.weight_lifted) : "");
      setRpe(existing?.rpe != null ? String(existing.rpe) : "");
      setWorkoutScale(
        (existing?.workout_scale as WorkoutScale) ?? (wod.prescribed_scale as WorkoutScale) ?? "rx",
      );
      setLiftStatus(existing?.status === "failed" ? "failed" : "completed");
    }
  }, [open, existing, wod.prescribed_scale]);

  async function submit() {
    if (!contactId) {
      toast.error("Sign in to log scores");
      return;
    }
    const weightNum = weight ? Number(weight) : null;
    const rpeNum = rpe ? Number(rpe) : null;
    if (isMetcon && !score.trim()) {
      toast.error("Enter a score or time");
      return;
    }
    if (!isMetcon && (weightNum == null || Number.isNaN(weightNum))) {
      toast.error("Enter weight lifted");
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
      score: score || null,
      weightLifted: weightNum,
      rpe: rpeNum,
      isPr: false,
      status: isMetcon ? "completed" : liftStatus,
      workoutScale: workoutScale || null,
      isMetcon,
    });

    if (error) {
      toast.error("Couldn't save score", { description: error });
      return;
    }

    let becamePr = false;
    if (
      !isMetcon &&
      liftStatus === "completed" &&
      weightNum != null &&
      item.benchmark_definition_id
    ) {
      const { error: prErr } = await recomputeBenchmarkSummary(
        contactId,
        item.benchmark_definition_id,
      );
      if (prErr) {
        toast.error("Score saved but PR vault didn't update", { description: prErr });
      } else {
        const { data: bench } = await supabase
          .from("athlete_benchmark_summary")
          .select("current_pr_weight")
          .eq("contact_id", contactId)
          .eq("benchmark_definition_id", item.benchmark_definition_id)
          .maybeSingle();
        becamePr = bench?.current_pr_weight === weightNum;
      }
    }

    if (becamePr && !existing?.is_pr) {
      toast.success("New PR!", {
        description: `${weightNum} lb on ${item.bench_name ?? "lift"}`,
      });
    } else {
      toast.success(existing ? "Score updated" : "Score logged");
    }
    setOpen(false);
    onLogged?.();
  }

  async function markNa() {
    if (!existing?.id) {
      setOpen(false);
      onLogged?.();
      return;
    }
    const { error } = await removePerformance(existing.id);
    if (error) toast.error(error);
    else {
      toast.message("Segment marked N/A");
      setOpen(false);
      onLogged?.();
    }
  }

  const loggedDisplay = existing
    ? existing.weight_lifted != null
      ? `${existing.weight_lifted} lb${existing.status === "failed" ? " (fail)" : ""}`
      : (existing.score ?? "Logged")
    : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40 md:p-5",
            isLogged && "bg-primary/[0.04]",
          )}
        >
          <AthletePrescriptionHeader
            movementName={item.bench_name ?? wod.name ?? "Set"}
            repsPrescribed={item.reps_prescribed}
            prescribedPercentage={item.prescribed_percentage}
            repMaxCount={repCount}
            prescribedWeight={item.prescribed_weight}
            prescribedScore={item.prescribed_score}
            sequenceNumber={item.sequence_number}
            compact
            className="min-w-0 flex-1"
          />
          <div className="flex shrink-0 items-center gap-2">
            {isLogged ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-mono-num text-base font-black leading-none text-primary">
                    {loggedDisplay}
                  </p>
                  {existing?.rpe != null && (
                    <p className="font-mono-num mt-0.5 text-[10px] text-muted-foreground">
                      RPE {existing.rpe}
                    </p>
                  )}
                </div>
                {existing?.is_pr ? (
                  <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
                    <Flame className="h-3 w-3" /> PR
                  </Badge>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ) : (
              <>
                <span className="hidden items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline-flex">
                  <Plus className="h-3 w-3" /> Log
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="border-border bg-card">
        <SheetHeader>
          <SheetTitle className="sr-only">
            {isLogged ? "Edit score" : "Log score"} · {item.bench_name ?? wod.name}
          </SheetTitle>
          <AthletePrescriptionHeader
            movementName={item.bench_name ?? wod.name ?? "Set"}
            repsPrescribed={item.reps_prescribed}
            prescribedPercentage={item.prescribed_percentage}
            repMaxCount={repCount}
            prescribedWeight={item.prescribed_weight}
            prescribedScore={item.prescribed_score}
            sequenceNumber={item.sequence_number}
          />
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Scale</Label>
            <Select value={workoutScale} onValueChange={(v) => setWorkoutScale(v as WorkoutScale)}>
              <SelectTrigger>
                <SelectValue placeholder="Rx" />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_SCALE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isMetcon ? (
            <div className="space-y-2">
              <Label>Score / time / rounds</Label>
              <Input
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 8:42 or 12 rounds + 5"
                className="font-mono-num text-2xl"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Weight (lb)</Label>
                <Input
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 285"
                  className="font-mono-num text-2xl"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={liftStatus === "completed" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setLiftStatus("completed")}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Completed
                </Button>
                <Button
                  type="button"
                  variant={liftStatus === "failed" ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setLiftStatus("failed")}
                >
                  <XCircle className="mr-1 h-4 w-4" /> Failed
                </Button>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>RPE (1–10, optional)</Label>
            <Input
              inputMode="decimal"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              placeholder="e.g. 8.5"
              className="font-mono-num"
            />
          </div>
          <Button
            onClick={() => void submit()}
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            {submitting ? "Saving…" : isLogged ? "Update score" : "Save score"}
          </Button>
          {isLogged && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => void markNa()}>
              Mark N/A (clear result)
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
