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
import { parseWorkoutScheme, schemeSummaryLabel } from "@/lib/programming/workout-scheme-schema";
import { useSaveGroupPerformance } from "@/hooks/useSaveGroupPerformance";
import { useAuth, resolveDefaultWorkoutScale } from "@/contexts/AuthContext";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type Props = {
  groupId: string;
  wodDate: string;
  partCount: number;
  contactId: string | null;
  existing: SegmentPerformance | null;
  prescribedScale?: string | null;
  workoutScheme?: unknown;
  onLogged?: () => void;
};

export function GroupScoreRow({
  groupId,
  wodDate,
  partCount,
  contactId,
  existing,
  prescribedScale,
  workoutScheme,
  onLogged,
}: Props) {
  const { defaultWorkoutScale } = useAuth();
  const [score, setScore] = useState("");
  const [completed, setCompleted] = useState(false);
  const [workoutScale, setWorkoutScale] = useState<WorkoutScale | "">("");
  const scheme = parseWorkoutScheme(workoutScheme);
  const schemeLabel = schemeSummaryLabel(scheme);
  const scoreMetric = effectiveScoreMetric(scheme?.scoreMetric, scheme?.kind);
  const { save, submitting } = useSaveGroupPerformance();

  useEffect(() => {
    setScore(existing?.score ?? "");
    setCompleted(existing?.score?.toLowerCase() === "completed" || existing?.score === "Yes");
    setWorkoutScale(
      resolveDefaultWorkoutScale(existing?.workout_scale, prescribedScale, defaultWorkoutScale),
    );
  }, [existing?.id, existing?.score, existing?.workout_scale, prescribedScale, defaultWorkoutScale]);

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
      segmentGroupId: groupId,
      wodDate,
      existingId: existing?.id,
      score: value,
      resultValue: secs,
      workoutScale: workoutScale || null,
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

  const headline = schemeLabel ?? `Block · ${partCount} parts`;

  return (
    <div className={cn("space-y-4 border-t border-border/60 p-4 md:p-5", isLogged && "bg-primary/[0.04]")}>
      <div>
        <p className="eyebrow">Workout block result</p>
        <p className="mt-1 text-lg font-black tracking-tight text-primary">{headline}</p>
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
        {isLogged ? "Update total" : "Log total"}
      </Button>
    </div>
  );
}
