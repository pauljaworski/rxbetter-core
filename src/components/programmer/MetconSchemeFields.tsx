import type { EditorWod } from "@/hooks/staff/types";
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
import {
  defaultSchemeForKind,
  resolveEditorWorkoutScheme,
  SCORE_METRIC_OPTIONS,
  schemeSummaryLabel,
  supportsOptionalTimeCap,
  WORKOUT_INTENT_OPTIONS,
  type ScoreMetric,
  type WorkoutIntent,
  type WorkoutScheme,
} from "@/lib/programming/workout-scheme-schema";
import { DurationSecInput } from "@/components/programmer/DurationSecInput";

type Props = {
  wod: EditorWod;
  onUpdate: (patch: Partial<EditorWod>) => void;
};

function effectiveScheme(wod: EditorWod): WorkoutScheme | null {
  return resolveEditorWorkoutScheme(wod);
}

function withMetric<T extends WorkoutScheme>(
  scheme: T,
  scoreMetric: ScoreMetric,
  workoutIntent?: WorkoutIntent,
): T {
  return {
    ...scheme,
    scoreMetric: scoreMetric as T["scoreMetric"],
    workoutIntent: workoutIntent ?? scheme.workoutIntent,
  };
}

export function MetconSchemeFields({ wod, onUpdate }: Props) {
  const scheme = effectiveScheme(wod);
  const summary = schemeSummaryLabel(scheme);

  function setScheme(next: WorkoutScheme) {
    onUpdate({ workout_scheme: next });
  }

  if (!wod.metcon_format) {
    return (
      <p className="text-xs text-muted-foreground">
        Select a workout format to configure rounds, time cap, and scoring.
      </p>
    );
  }

  if (!scheme) {
    return null;
  }

  const scoreMetric = scheme.scoreMetric ?? "time";
  const workoutIntent = scheme.workoutIntent;

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
      {summary && <p className="text-xs font-semibold text-primary">{summary}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Score by
          </Label>
          <Select
            value={scoreMetric}
            onValueChange={(v) =>
              setScheme(withMetric(scheme, v as ScoreMetric, workoutIntent))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCORE_METRIC_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Intent
          </Label>
          <Select
            value={workoutIntent ?? "for_time"}
            onValueChange={(v) =>
              setScheme({ ...scheme, workoutIntent: v as WorkoutIntent })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKOUT_INTENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {scheme.kind === "rft" && (
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rounds
            </Label>
            <Input
              type="number"
              min={1}
              max={99}
              className="h-8 w-24 font-mono-num"
              value={scheme.rounds}
              onChange={(e) =>
                setScheme(
                  withMetric(
                    {
                      kind: "rft",
                      rounds: Math.max(1, Number(e.target.value) || 1),
                      restBetweenRoundsSec: scheme.restBetweenRoundsSec,
                      timeCapMin: scheme.timeCapMin,
                      scoreMetric: "time",
                    },
                    scoreMetric,
                    workoutIntent,
                  ),
                )
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rest between rounds (sec)
            </Label>
            <Input
              type="number"
              min={0}
              max={600}
              className="h-8 w-24 font-mono-num"
              value={scheme.restBetweenRoundsSec ?? ""}
              placeholder="0"
              onChange={(e) => {
                const v = e.target.value;
                setScheme(
                  withMetric(
                    {
                      kind: "rft",
                      rounds: scheme.rounds,
                      restBetweenRoundsSec:
                        v === "" ? undefined : Math.max(0, Number(v) || 0),
                      timeCapMin: scheme.timeCapMin,
                      scoreMetric: "time",
                    },
                    scoreMetric,
                    workoutIntent,
                  ),
                );
              }}
            />
            <p className="text-[10px] text-muted-foreground">
              Athletes log working time per round; rest is excluded from the score.
            </p>
          </div>
        </div>
      )}

      {supportsOptionalTimeCap(scheme.kind) && (
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Time cap (min, optional)
          </Label>
          <Input
            type="number"
            min={1}
            max={120}
            className="h-8 w-24 font-mono-num"
            value={
              "timeCapMin" in scheme && scheme.timeCapMin != null ? scheme.timeCapMin : ""
            }
            placeholder="e.g. 20"
            onChange={(e) => {
              const v = e.target.value;
              const timeCapMin =
                v === "" ? undefined : Math.min(120, Math.max(1, Number(v) || 1));
              setScheme({ ...scheme, timeCapMin } as WorkoutScheme);
            }}
          />
          <p className="text-[10px] text-muted-foreground">
            Shown to athletes (e.g. 20-minute cap). Leave blank for no cap.
          </p>
        </div>
      )}

      {scheme.kind === "amrap" && (
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Time cap (min)
          </Label>
          <Input
            type="number"
            min={1}
            max={120}
            className="h-8 w-24 font-mono-num"
            value={scheme.timeCapMin}
            onChange={(e) =>
              setScheme({
                ...scheme,
                timeCapMin: Math.max(1, Number(e.target.value) || 12),
              })
            }
          />
        </div>
      )}

      {scheme.kind === "amrap_repeat" && (
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              AMRAP (min)
            </Label>
            <Input
              type="number"
              min={1}
              max={60}
              className="h-8 w-24 font-mono-num"
              value={scheme.timeCapMin}
              onChange={(e) =>
                setScheme({
                  ...scheme,
                  timeCapMin: Math.max(1, Number(e.target.value) || 3),
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Repeats
            </Label>
            <Input
              type="number"
              min={2}
              max={10}
              className="h-8 w-24 font-mono-num"
              value={scheme.rounds}
              onChange={(e) =>
                setScheme({
                  ...scheme,
                  rounds: Math.max(2, Number(e.target.value) || 3),
                })
              }
            />
          </div>
        </div>
      )}

      {(scheme.kind === "emom" || scheme.kind === "emom_completion") && (
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Minutes
          </Label>
          <Input
            type="number"
            min={1}
            max={60}
            className="h-8 w-24 font-mono-num"
            value={scheme.minutes}
            onChange={(e) =>
              setScheme({
                ...scheme,
                minutes: Math.max(1, Number(e.target.value) || 10),
              })
            }
          />
        </div>
      )}

      {scheme.kind === "interval_series" && (
        <div className="flex flex-wrap gap-3">
          <DurationSecInput
            label="Interval"
            valueSec={scheme.intervalSec}
            minSec={30}
            maxSec={600}
            onChange={(intervalSec) => setScheme({ ...scheme, intervalSec })}
          />
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rounds
            </Label>
            <Input
              type="number"
              min={1}
              max={30}
              className="h-8 w-24 font-mono-num"
              value={scheme.rounds}
              onChange={(e) =>
                setScheme({
                  ...scheme,
                  rounds: Math.max(1, Number(e.target.value) || 6),
                })
              }
            />
          </div>
        </div>
      )}

      {scheme.kind === "tabata" && (
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Work (sec)
            </Label>
            <Input
              type="number"
              className="h-8 w-20 font-mono-num"
              value={scheme.workSec}
              onChange={(e) =>
                setScheme({ ...scheme, workSec: Math.max(10, Number(e.target.value) || 20) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rest (sec)
            </Label>
            <Input
              type="number"
              className="h-8 w-20 font-mono-num"
              value={scheme.restSec}
              onChange={(e) =>
                setScheme({ ...scheme, restSec: Math.max(0, Number(e.target.value) || 10) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rounds
            </Label>
            <Input
              type="number"
              className="h-8 w-20 font-mono-num"
              value={scheme.rounds}
              onChange={(e) =>
                setScheme({ ...scheme, rounds: Math.max(1, Number(e.target.value) || 8) })
              }
            />
          </div>
        </div>
      )}

      {scheme.kind === "rep_ladder" && (
        <div className="space-y-3 rounded-md border border-dashed border-border/80 bg-background/60 p-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rep sequence (e.g. 21-18-15-12-9)
            </Label>
            <Input
              className="h-8 font-mono-num text-xs"
              value={scheme.repSequence.join("-")}
              onChange={(e) => {
                const seq = e.target.value
                  .split(/[-–—,\s]+/)
                  .map((s) => Number(s.trim()))
                  .filter((n) => Number.isFinite(n) && n > 0);
                if (seq.length >= 2) {
                  setScheme({ ...scheme, repSequence: seq });
                }
              }}
            />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Between rounds (optional)
            </p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Movement done between each ladder set (e.g. 200m Run, 10 Burpees).
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Movement
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. Run"
                  value={scheme.betweenRounds?.label ?? ""}
                  onChange={(e) =>
                    setScheme({
                      ...scheme,
                      betweenRounds: {
                        amount: scheme.betweenRounds?.amount ?? null,
                        prescriptionUnit: scheme.betweenRounds?.prescriptionUnit ?? "meters",
                        label: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Distance / reps
                </Label>
                <Input
                  type="number"
                  min={0}
                  className="h-8 font-mono-num"
                  value={scheme.betweenRounds?.amount ?? ""}
                  placeholder="200"
                  onChange={(e) =>
                    setScheme({
                      ...scheme,
                      betweenRounds: {
                        label: scheme.betweenRounds?.label ?? "",
                        prescriptionUnit: scheme.betweenRounds?.prescriptionUnit ?? "meters",
                        amount: e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Unit
                </Label>
                <Select
                  value={scheme.betweenRounds?.prescriptionUnit ?? "meters"}
                  onValueChange={(v) =>
                    setScheme({
                      ...scheme,
                      betweenRounds: {
                        label: scheme.betweenRounds?.label ?? "",
                        amount: scheme.betweenRounds?.amount ?? null,
                        prescriptionUnit: v as "reps" | "meters" | "calories" | "feet",
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meters">Meters</SelectItem>
                    <SelectItem value="feet">Feet</SelectItem>
                    <SelectItem value="reps">Reps</SelectItem>
                    <SelectItem value="calories">Calories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(scheme.betweenRounds?.label || scheme.betweenRounds?.amount != null) && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2 h-7 text-xs"
                onClick={() => setScheme({ ...scheme, betweenRounds: undefined })}
              >
                Clear between-rounds movement
              </Button>
            )}
          </div>
        </div>
      )}

      {(scheme.kind === "for_time" || scheme.kind === "chipper") && (
        <p className="text-xs text-muted-foreground">
          Athletes log one {scoreMetric === "completion" ? "completion" : "score"} for this
          segment.
        </p>
      )}
    </div>
  );
}

/** Apply a workout format template (kind) to segment. */
export function applyWorkoutFormatKind(
  kind: WorkoutScheme["kind"],
): Pick<EditorWod, "metcon_format" | "workout_scheme"> {
  const scheme = defaultSchemeForKind(kind);
  const metconFormat =
    kind === "amrap" || kind === "amrap_repeat"
      ? "amrap"
      : kind === "emom" || kind === "emom_completion" || kind === "interval_series" || kind === "tabata"
        ? "emom"
        : kind === "chipper"
          ? "chipper"
          : "for_time";
  return { metcon_format: metconFormat, workout_scheme: scheme };
}
