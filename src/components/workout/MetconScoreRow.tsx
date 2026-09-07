import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WORKOUT_SCALE_OPTIONS, type WorkoutScale } from "@/lib/format";
import {
  effectiveScoreMetric,
  metconScorePlaceholder,
  parseScoreToSeconds,
  scoreFieldLabel,
} from "@/lib/programming/metcon-score";
import { parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import { useSaveSegmentPerformance } from "@/hooks/useSaveSegmentPerformance";
import { useAuth, resolveDefaultWorkoutScale } from "@/contexts/AuthContext";
import type { LogWodContext } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type Props = {
  wod: LogWodContext & { workout_scheme?: unknown };
  contactId: string | null;
  existing: SegmentPerformance | null;
  onLogged?: () => void;
};

export function MetconScoreRow({ wod, contactId, existing, onLogged }: Props) {
  const { defaultWorkoutScale } = useAuth();
  const [score, setScore] = useState("");
  const [completed, setCompleted] = useState(false);
  const [workoutScale, setWorkoutScale] = useState<WorkoutScale | "">("");
  const [editing, setEditing] = useState(false);
  const [localLogged, setLocalLogged] = useState(false);
  const scheme = parseWorkoutScheme(wod.workout_scheme);
  const scoreMetric = effectiveScoreMetric(scheme?.scoreMetric, scheme?.kind);
  const { save, submitting } = useSaveSegmentPerformance();

  useEffect(() => {
    setScore(existing?.score ?? "");
    setCompleted(existing?.score?.toLowerCase() === "completed" || existing?.score === "Yes");
    setWorkoutScale(
      resolveDefaultWorkoutScale(
        existing?.workout_scale,
        wod.prescribed_scale,
        defaultWorkoutScale,
      ),
    );
    setEditing(false);
    setLocalLogged(false);
  }, [existing?.id, existing?.score, existing?.workout_scale, wod.prescribed_scale, defaultWorkoutScale]);

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
    setLocalLogged(true);
    setEditing(false);
    toast.success(existing ? "Score updated" : "Score saved");
    onLogged?.();
  }

  const isLogged =
    localLogged ||
    (scoreMetric === "completion" ? completed || !!existing?.score : !!existing?.score);
  const readOnly = isLogged && !editing;

  return (
    <div
      className={cn(
        "space-y-4 p-4 md:p-5",
        isLogged && "bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-500/25",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Your result</p>
        {isLogged && (
          <Badge className="gap-1 bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Saved
          </Badge>
        )}
      </div>

      {readOnly ? (
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border border-border/60 bg-card/80 px-3 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {scoreFieldLabel(scoreMetric)}
            </p>
            <p className="font-mono-num text-2xl font-black tracking-tight">
              {scoreMetric === "completion" ? "Completed" : score || existing?.score}
            </p>
            {workoutScale && (
              <p className="mt-1 text-xs text-muted-foreground">
                {WORKOUT_SCALE_OPTIONS.find((o) => o.value === workoutScale)?.label ?? workoutScale}
              </p>
            )}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{scoreFieldLabel(scoreMetric)}</Label>
              {scoreMetric === "completion" ? (
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 px-3 py-3">
                  <Checkbox
                    checked={completed}
                    onCheckedChange={(c) => setCompleted(c === true)}
                  />
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
              <Select
                value={workoutScale}
                onValueChange={(v) => setWorkoutScale(v as WorkoutScale)}
              >
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
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => void submit()}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {isLogged ? "Update score" : "Log score"}
            </Button>
            {editing && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
