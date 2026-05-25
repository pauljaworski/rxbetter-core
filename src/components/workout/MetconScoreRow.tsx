import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WORKOUT_SCALE_OPTIONS, type WorkoutScale } from "@/lib/format";
import {
  effectiveScoreMetric,
  metconScorePlaceholder,
  parseScoreToSeconds,
  scoreFieldLabel,
} from "@/lib/programming/metcon-score";
import {
  parseWorkoutScheme,
  schemeSummaryLabel,
} from "@/lib/programming/workout-scheme-schema";
import { useSaveSegmentPerformance } from "@/hooks/useSaveSegmentPerformance";
import type { LogWodContext } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type Props = {
  wod: LogWodContext & { workout_scheme?: unknown };
  contactId: string | null;
  existing: SegmentPerformance | null;
  onLogged?: () => void;
};

export function MetconScoreRow({ wod, contactId, existing, onLogged }: Props) {
  const [score, setScore] = useState("");
  const [completed, setCompleted] = useState(false);
  const [workoutScale, setWorkoutScale] = useState<WorkoutScale | "">("");
  const scheme = parseWorkoutScheme(wod.workout_scheme);
  const schemeLabel = schemeSummaryLabel(scheme);
  const scoreMetric = effectiveScoreMetric(scheme?.scoreMetric, scheme?.kind);
  const { save, submitting } = useSaveSegmentPerformance();

  useEffect(() => {
    setScore(existing?.score ?? "");
    setCompleted(existing?.score?.toLowerCase() === "completed" || existing?.score === "Yes");
    setWorkoutScale(
      (existing?.workout_scale as WorkoutScale) ?? (wod.prescribed_scale as WorkoutScale) ?? "rx",
    );
  }, [existing?.id, existing?.score, wod.prescribed_scale]);

  async function submit() {
    if (!contactId) {
      toast.error("Sign in to log your score");
      return;
    }
    const value =
      scoreMetric === "completion" ? (completed ? "Completed" : "") : score.trim();
    if (!value) {
      toast.error(
        scoreMetric === "completion" ? "Mark completion when finished" : "Enter your score",
      );
      return;
    }
    const secs =
      scoreMetric === "time" || scoreMetric === "sum_interval_times"
        ? parseScoreToSeconds(value)
        : null;
    const { error } = await save({
      contactId,
      programmingId: wod.id,
      wodDate: wod.wod_date,
      existingId: existing?.id,
      score: value,
      resultValue: secs,
      workoutScale: workoutScale || null,
      programmingSegment: wod.programming_segment,
    });
    if (error) {
      toast.error("Couldn't save", { description: error });
      return;
    }
    toast.success(existing ? "Score updated" : "Score logged");
    onLogged?.();
  }

  const isLogged =
    scoreMetric === "completion" ? completed || !!existing?.score : !!existing?.score;

  return (
    <div className={cn("space-y-4 p-4 md:p-5", isLogged && "bg-primary/[0.04]")}>
      <div>
        <p className="eyebrow">Your result</p>
        {schemeLabel && (
          <p className="mt-1 text-lg font-black tracking-tight text-primary">{schemeLabel}</p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>{scoreFieldLabel(scoreMetric)}</Label>
          {scoreMetric === "completion" ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 px-3 py-3">
              <Checkbox checked={completed} onCheckedChange={(c) => setCompleted(c === true)} />
              <span className="text-sm font-medium">Completed</span>
            </label>
          ) : (
            <Input
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={metconScorePlaceholder(scoreMetric, scheme?.kind)}
              className="font-mono-num text-2xl"
            />
          )}
        </div>
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
      </div>
      <Button
        size="sm"
        disabled={submitting}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => void submit()}
      >
        <CheckCircle2 className="mr-1 h-4 w-4" />
        {isLogged ? "Update score" : "Log score"}
      </Button>
    </div>
  );
}
