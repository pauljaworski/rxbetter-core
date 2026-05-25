import type { EditorWod } from "@/hooks/staff/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultSchemeForMetconFormat,
  parseWorkoutScheme,
  schemeSummaryLabel,
  type WorkoutScheme,
} from "@/lib/programming/workout-scheme-schema";

type Props = {
  wod: EditorWod;
  onUpdate: (patch: Partial<EditorWod>) => void;
};

function effectiveScheme(wod: EditorWod): WorkoutScheme | null {
  return (
    parseWorkoutScheme(wod.workout_scheme) ??
    defaultSchemeForMetconFormat(wod.metcon_format)
  );
}

export function MetconSchemeFields({ wod, onUpdate }: Props) {
  const scheme = effectiveScheme(wod);
  const summary = schemeSummaryLabel(scheme);

  function setScheme(next: WorkoutScheme) {
    onUpdate({ workout_scheme: next });
  }

  if (!wod.metcon_format) {
    return (
      <p className="text-xs text-muted-foreground">Select a format to configure rounds or time cap.</p>
    );
  }

  if (!scheme) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 p-3">
      {summary && (
        <p className="text-xs font-semibold text-primary">{summary}</p>
      )}
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
              setScheme({
                kind: "rft",
                rounds: Math.max(1, Number(e.target.value) || 1),
                scoreMetric: "time",
              })
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
                kind: "amrap",
                timeCapMin: Math.max(1, Number(e.target.value) || 12),
                scoreMetric: "rounds_reps",
              })
            }
          />
        </div>
      )}
      {scheme.kind === "emom" && (
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
                kind: "emom",
                minutes: Math.max(1, Number(e.target.value) || 10),
                scoreMetric: "rounds_reps",
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
      {(scheme.kind === "for_time" || scheme.kind === "chipper") && (
        <p className="text-xs text-muted-foreground">
          Athletes log one time for this segment.
        </p>
      )}
    </div>
  );
}
