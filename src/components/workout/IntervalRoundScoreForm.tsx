import { useEffect, useMemo, useState } from "react";
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
import { emptyRoundInputs, formatSecondsToMmSs } from "@/lib/programming/rft-score";
import {
  buildIntervalScoreMeta,
  deriveIntervalTotalTime,
  intervalRoundInputsFromMeta,
  parseIntervalScoreMeta,
} from "@/lib/programming/interval-score";
import type { intervalSeriesSchemeSchema } from "@/lib/programming/workout-scheme-schema";
import type { z } from "zod";
import { useSaveSegmentPerformance } from "@/hooks/useSaveSegmentPerformance";
import { useAuth, resolveDefaultWorkoutScale } from "@/contexts/AuthContext";
import type { LogWodContext } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type IntervalScheme = z.infer<typeof intervalSeriesSchemeSchema>;

type Props = {
  wod: LogWodContext & { workout_scheme?: unknown };
  scheme: IntervalScheme;
  contactId: string | null;
  existing: SegmentPerformance | null;
  onLogged?: () => void;
};

export function IntervalRoundScoreForm({ wod, scheme, contactId, existing, onLogged }: Props) {
  const { defaultWorkoutScale } = useAuth();
  const rounds = scheme.rounds;
  const { save, submitting } = useSaveSegmentPerformance();

  const [roundInputs, setRoundInputs] = useState<string[]>(() => emptyRoundInputs(rounds));
  const [workoutScale, setWorkoutScale] = useState<WorkoutScale | "">("");

  useEffect(() => {
    const meta = parseIntervalScoreMeta(existing?.score_meta);
    setRoundInputs(intervalRoundInputsFromMeta(meta, rounds));
    setWorkoutScale(
      resolveDefaultWorkoutScale(
        existing?.workout_scale,
        wod.prescribed_scale,
        defaultWorkoutScale,
      ),
    );
  }, [
    existing?.id,
    existing?.score_meta,
    existing?.workout_scale,
    rounds,
    wod.prescribed_scale,
    defaultWorkoutScale,
  ]);

  const preview = useMemo(
    () => deriveIntervalTotalTime(rounds, roundInputs),
    [rounds, roundInputs],
  );

  async function submit() {
    if (!contactId) {
      toast.error("Sign in to log your score");
      return;
    }
    if (!preview.ok) {
      toast.error("error" in preview ? preview.error : "Invalid score");
      return;
    }
    const totalSec = preview.result.totalTimeSec;
    const scoreMeta = buildIntervalScoreMeta(rounds, scheme.intervalSec, preview.result);
    const score = formatSecondsToMmSs(totalSec);

    const { error } = await save({
      contactId,
      programmingId: wod.id,
      wodDate: wod.wod_date,
      existingId: existing?.id,
      score,
      resultValue: totalSec,
      scoreMeta,
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

  const isLogged = !!existing?.score;
  const totalPreview = preview.ok ? formatSecondsToMmSs(preview.result.totalTimeSec) : null;

  return (
    <div className={cn("space-y-4 p-4 md:p-5", isLogged && "bg-primary/[0.04]")}>
      <div>
        <p className="eyebrow">Your result</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter your working time for each interval. Total is the sum of all rounds.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Interval times
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: rounds }, (_, i) => (
            <div key={i} className="space-y-1">
              <Label className="text-xs text-muted-foreground">Interval {i + 1}</Label>
              <Input
                value={roundInputs[i] ?? ""}
                onChange={(e) => {
                  const next = [...roundInputs];
                  next[i] = e.target.value;
                  setRoundInputs(next);
                }}
                placeholder="e.g. 3:45 or 225"
                className="font-mono-num h-9"
                inputMode="numeric"
              />
            </div>
          ))}
        </div>
        {totalPreview && (
          <p className="text-sm font-semibold text-primary">
            Total time: <span className="font-mono-num">{totalPreview}</span>
          </p>
        )}
        {!preview.ok && roundInputs.some((r) => r.trim()) && (
          <p className="text-xs text-destructive">{"error" in preview ? preview.error : ""}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
