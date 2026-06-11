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
import {
  buildRftScoreMeta,
  deriveRftWorkingTime,
  emptyRoundInputs,
  formatRestLabel,
  formatSecondsToMmSs,
  parseRftScoreMeta,
  rftRestTotalSec,
  roundInputsFromMeta,
} from "@/lib/programming/rft-score";
import {
  schemeSummaryLabel,
  type rftSchemeSchema,
} from "@/lib/programming/workout-scheme-schema";
import type { z } from "zod";

type RftScheme = z.infer<typeof rftSchemeSchema>;
import { useSaveSegmentPerformance } from "@/hooks/useSaveSegmentPerformance";
import type { LogWodContext } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type Props = {
  wod: LogWodContext & { workout_scheme?: unknown };
  scheme: RftScheme;
  contactId: string | null;
  existing: SegmentPerformance | null;
  onLogged?: () => void;
};

export function RftRoundScoreForm({ wod, scheme, contactId, existing, onLogged }: Props) {
  const rounds = scheme.rounds;
  const restSec = scheme.restBetweenRoundsSec ?? 0;
  const restTotalSec = rftRestTotalSec(rounds, restSec);
  const schemeLabel = schemeSummaryLabel(scheme);
  const { save, submitting } = useSaveSegmentPerformance();

  const [roundInputs, setRoundInputs] = useState<string[]>(() => emptyRoundInputs(rounds));
  const [workoutScale, setWorkoutScale] = useState<WorkoutScale | "">("");

  useEffect(() => {
    const meta = parseRftScoreMeta(existing?.score_meta);
    setRoundInputs(roundInputsFromMeta(meta, rounds));
    const prescribed = wod.prescribed_scale as WorkoutScale | "na" | null;
    const defaultScale =
      prescribed && prescribed !== "na" ? (prescribed as WorkoutScale) : "";
    setWorkoutScale((existing?.workout_scale as WorkoutScale) ?? defaultScale);
  }, [existing?.id, existing?.score_meta, rounds, wod.prescribed_scale]);

  const preview = useMemo(() => deriveRftWorkingTime(rounds, restSec, roundInputs), [rounds, restSec, roundInputs]);

  async function submit() {
    if (!contactId) {
      toast.error("Sign in to log your score");
      return;
    }
    if (!preview.ok) {
      toast.error("error" in preview ? preview.error : "Invalid score");
      return;
    }
    const workingSec = preview.result.workingTimeSec;
    const scoreMeta = buildRftScoreMeta(rounds, restSec, preview.result);
    const score = formatSecondsToMmSs(workingSec);

    const { error } = await save({
      contactId,
      programmingId: wod.id,
      wodDate: wod.wod_date,
      existingId: existing?.id,
      score,
      resultValue: workingSec,
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
  const workingPreview =
    preview.ok ? formatSecondsToMmSs(preview.result.workingTimeSec) : null;

  return (
    <div className={cn("space-y-4 p-4 md:p-5", isLogged && "bg-primary/[0.04]")}>
      <div>
        <p className="eyebrow">Your result</p>
        {schemeLabel && (
          <p className="mt-1 text-lg font-black tracking-tight text-primary">{schemeLabel}</p>
        )}
        {restTotalSec > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Prescribed rest: {formatRestLabel(restTotalSec)} total (excluded from working time)
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Round working times
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: rounds }, (_, i) => {
            const isLast = i === rounds - 1;
            return (
              <div key={i} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Round {i + 1}
                  {isLast && rounds > 1 ? " (or total working time)" : ""}
                </Label>
                <Input
                  value={roundInputs[i] ?? ""}
                  onChange={(e) => {
                    const next = [...roundInputs];
                    next[i] = e.target.value;
                    setRoundInputs(next);
                  }}
                  placeholder="e.g. 3:45"
                  className="font-mono-num h-9"
                  inputMode="numeric"
                />
              </div>
            );
          })}
        </div>
        {workingPreview && (
          <p className="text-sm font-semibold text-primary">
            Working time: <span className="font-mono-num">{workingPreview}</span>
          </p>
        )}
        {!preview.ok && roundInputs.some((r) => r.trim()) && (
          <p className="text-xs text-destructive">{"error" in preview ? preview.error : ""}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Log each round&apos;s working time, or leave rounds 1–{rounds - 1} blank and enter total
          working time in round {rounds}.
        </p>
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
