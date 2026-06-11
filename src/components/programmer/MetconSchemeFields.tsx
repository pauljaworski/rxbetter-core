import type { EditorWod } from "@/hooks/staff/types";
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
  WORKOUT_INTENT_OPTIONS,
  type ScoreMetric,
  type WorkoutIntent,
  type WorkoutScheme,
} from "@/lib/programming/workout-scheme-schema";

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
                    scoreMetric: "time",
                  },
                  scoreMetric,
                  workoutIntent,
                ),
              )
            }
          />
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
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Interval (sec)
            </Label>
            <Input
              type="number"
              min={30}
              max={600}
              className="h-8 w-24 font-mono-num"
              value={scheme.intervalSec}
              onChange={(e) =>
                setScheme({
                  ...scheme,
                  intervalSec: Math.max(30, Number(e.target.value) || 90),
                })
              }
            />
          </div>
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
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rep sequence (e.g. 21-18-15-12-9)
            </Label>
            <Input
              className="h-8 font-mono-num text-xs"
              value={scheme.repSequence.join("-")}
              onChange={(e) => {
                const seq = e.target.value
                  .split(/[-–—]/)
                  .map((s) => Number(s.trim()))
                  .filter((n) => Number.isFinite(n) && n > 0);
                if (seq.length >= 2) {
                  setScheme({ ...scheme, repSequence: seq });
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Between rounds
              </Label>
              <Input
                className="h-8 w-32 text-xs"
                placeholder="Run"
                value={scheme.betweenRounds?.label ?? ""}
                onChange={(e) =>
                  setScheme({
                    ...scheme,
                    betweenRounds: {
                      ...scheme.betweenRounds,
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
                className="h-8 w-20 font-mono-num"
                value={scheme.betweenRounds?.amount ?? ""}
                onChange={(e) =>
                  setScheme({
                    ...scheme,
                    betweenRounds: {
                      ...scheme.betweenRounds,
                      amount: e.target.value === "" ? null : Number(e.target.value),
                      prescriptionUnit:
                        scheme.betweenRounds?.prescriptionUnit ?? "meters",
                    },
                  })
                }
              />
            </div>
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
