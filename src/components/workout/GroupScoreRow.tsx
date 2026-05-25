import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { metconScorePlaceholder, parseScoreToSeconds } from "@/lib/programming/metcon-score";
import { useSaveGroupPerformance } from "@/hooks/useSaveGroupPerformance";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type Props = {
  groupId: string;
  wodDate: string;
  partCount: number;
  contactId: string | null;
  existing: SegmentPerformance | null;
  prescribedScale?: string | null;
  onLogged?: () => void;
};

export function GroupScoreRow({
  groupId,
  wodDate,
  partCount,
  contactId,
  existing,
  prescribedScale,
  onLogged,
}: Props) {
  const [score, setScore] = useState("");
  const [workoutScale, setWorkoutScale] = useState<WorkoutScale | "">("");
  const { save, submitting } = useSaveGroupPerformance();

  useEffect(() => {
    setScore(existing?.score ?? "");
    setWorkoutScale(
      (existing?.workout_scale as WorkoutScale) ?? (prescribedScale as WorkoutScale) ?? "rx",
    );
  }, [existing?.id, existing?.score, prescribedScale]);

  async function submit() {
    if (!contactId) {
      toast.error("Sign in to log your score");
      return;
    }
    if (!score.trim()) {
      toast.error("Enter your total time");
      return;
    }
    const secs = parseScoreToSeconds(score);
    const { error } = await save({
      contactId,
      segmentGroupId: groupId,
      wodDate,
      existingId: existing?.id,
      score: score.trim(),
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

  const isLogged = !!existing?.score;

  return (
    <div className={cn("space-y-4 border-t border-border/60 p-4 md:p-5", isLogged && "bg-primary/[0.04]")}>
      <div>
        <p className="eyebrow">Workout block result</p>
        <p className="mt-1 text-lg font-black tracking-tight text-primary">
          Total time · {partCount} parts
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Total time</Label>
          <Input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder={metconScorePlaceholder("for_time")}
            className="font-mono-num text-2xl"
          />
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
