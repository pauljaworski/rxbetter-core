import { z } from "zod";

export const SCORE_METRICS = [
  "time",
  "rounds_reps",
  "reps",
  "completion",
  "sum_interval_times",
] as const;

export type ScoreMetric = (typeof SCORE_METRICS)[number];

export const WORKOUT_INTENTS = ["for_time", "for_quality", "for_completion"] as const;

export type WorkoutIntent = (typeof WORKOUT_INTENTS)[number];

const schemeBase = z.object({
  scoreMetric: z.enum(SCORE_METRICS).optional(),
  workoutIntent: z.enum(WORKOUT_INTENTS).optional(),
});

export const rftSchemeSchema = schemeBase.extend({
  kind: z.literal("rft"),
  rounds: z.number().int().min(1).max(99),
  scoreMetric: z.literal("time").default("time"),
});

export const forTimeSchemeSchema = schemeBase.extend({
  kind: z.literal("for_time"),
  scoreMetric: z.literal("time").default("time"),
});

export const amrapSchemeSchema = schemeBase.extend({
  kind: z.literal("amrap"),
  timeCapMin: z.number().int().min(1).max(120),
  scoreMetric: z.literal("rounds_reps").default("rounds_reps"),
});

export const amrapRepeatSchemeSchema = schemeBase.extend({
  kind: z.literal("amrap_repeat"),
  timeCapMin: z.number().int().min(1).max(60),
  rounds: z.number().int().min(2).max(10),
  scoreMetric: z.literal("rounds_reps").default("rounds_reps"),
});

export const emomSchemeSchema = schemeBase.extend({
  kind: z.literal("emom"),
  minutes: z.number().int().min(1).max(60),
  scoreMetric: z.literal("rounds_reps").default("rounds_reps"),
});

export const emomCompletionSchemeSchema = schemeBase.extend({
  kind: z.literal("emom_completion"),
  minutes: z.number().int().min(1).max(60),
  scoreMetric: z.literal("completion").default("completion"),
});

export const chipperSchemeSchema = schemeBase.extend({
  kind: z.literal("chipper"),
  scoreMetric: z.literal("time").default("time"),
});

export const intervalSeriesSchemeSchema = schemeBase.extend({
  kind: z.literal("interval_series"),
  intervalSec: z.number().int().min(30).max(600),
  rounds: z.number().int().min(1).max(30),
  scoreMetric: z.literal("sum_interval_times").default("sum_interval_times"),
});

export const tabataSchemeSchema = schemeBase.extend({
  kind: z.literal("tabata"),
  rounds: z.number().int().min(1).max(20).default(8),
  workSec: z.number().int().min(10).max(60).default(20),
  restSec: z.number().int().min(0).max(60).default(10),
  scoreMetric: z.literal("rounds_reps").default("rounds_reps"),
});

const betweenRoundSchema = z
  .object({
    amount: z.number().nullable().optional(),
    prescriptionUnit: z.enum(["reps", "meters", "calories", "feet"]).optional(),
    label: z.string().optional(),
  })
  .optional();

export const repLadderSchemeSchema = schemeBase.extend({
  kind: z.literal("rep_ladder"),
  repSequence: z.array(z.number().int().min(1)).min(2).max(12),
  scoreMetric: z.literal("time").default("time"),
  betweenRounds: betweenRoundSchema,
});

export const workoutSchemeSchema = z.discriminatedUnion("kind", [
  rftSchemeSchema,
  forTimeSchemeSchema,
  amrapSchemeSchema,
  amrapRepeatSchemeSchema,
  emomSchemeSchema,
  emomCompletionSchemeSchema,
  chipperSchemeSchema,
  intervalSeriesSchemeSchema,
  tabataSchemeSchema,
  repLadderSchemeSchema,
]);

export type WorkoutScheme = z.infer<typeof workoutSchemeSchema>;

export const emptyWorkoutScheme = {} as Record<string, never>;

/** Programmer-facing format templates (maps to workout_scheme.kind). */
export const WORKOUT_FORMAT_TEMPLATES: {
  kind: WorkoutScheme["kind"];
  label: string;
  metconFormat: string;
  description: string;
}[] = [
  { kind: "for_time", label: "For time", metconFormat: "for_time", description: "Single continuous effort" },
  { kind: "rft", label: "Rounds for time (RFT)", metconFormat: "for_time", description: "Fixed rounds, score = time" },
  { kind: "rep_ladder", label: "Rep ladder (21-18-15…)", metconFormat: "for_time", description: "Descending/ascending reps each round" },
  { kind: "chipper", label: "Chipper", metconFormat: "chipper", description: "All movements once, for time" },
  { kind: "amrap", label: "AMRAP", metconFormat: "amrap", description: "As many rounds/reps in time cap" },
  { kind: "amrap_repeat", label: "AMRAP repeats", metconFormat: "amrap", description: "Multiple AMRAP blocks" },
  { kind: "emom", label: "EMOM", metconFormat: "emom", description: "Every minute on the minute" },
  { kind: "emom_completion", label: "EMOM (completion)", metconFormat: "emom", description: "Mark complete each minute" },
  { kind: "interval_series", label: "Intervals", metconFormat: "emom", description: "Fixed intervals, sum or log times" },
  { kind: "tabata", label: "Tabata", metconFormat: "emom", description: "20s on / 10s off × rounds" },
];

export const SCORE_METRIC_OPTIONS: { value: ScoreMetric; label: string }[] = [
  { value: "time", label: "Time (mm:ss)" },
  { value: "rounds_reps", label: "Rounds + reps" },
  { value: "reps", label: "Total reps" },
  { value: "completion", label: "Completion (done / not done)" },
  { value: "sum_interval_times", label: "Sum of interval times" },
];

export const WORKOUT_INTENT_OPTIONS: { value: WorkoutIntent; label: string }[] = [
  { value: "for_time", label: "For time" },
  { value: "for_quality", label: "For quality (FQ)" },
  { value: "for_completion", label: "For completion" },
];

export function defaultSchemeForKind(kind: WorkoutScheme["kind"]): WorkoutScheme {
  switch (kind) {
    case "rft":
      return { kind: "rft", rounds: 3, scoreMetric: "time", workoutIntent: "for_time" };
    case "for_time":
      return { kind: "for_time", scoreMetric: "time", workoutIntent: "for_time" };
    case "amrap":
      return { kind: "amrap", timeCapMin: 12, scoreMetric: "rounds_reps" };
    case "amrap_repeat":
      return { kind: "amrap_repeat", timeCapMin: 3, rounds: 3, scoreMetric: "rounds_reps" };
    case "emom":
      return { kind: "emom", minutes: 10, scoreMetric: "rounds_reps" };
    case "emom_completion":
      return { kind: "emom_completion", minutes: 10, scoreMetric: "completion", workoutIntent: "for_completion" };
    case "chipper":
      return { kind: "chipper", scoreMetric: "time", workoutIntent: "for_time" };
    case "interval_series":
      return { kind: "interval_series", intervalSec: 120, rounds: 6, scoreMetric: "sum_interval_times" };
    case "tabata":
      return { kind: "tabata", rounds: 8, workSec: 20, restSec: 10, scoreMetric: "rounds_reps" };
    case "rep_ladder":
      return {
        kind: "rep_ladder",
        repSequence: [21, 18, 15, 12, 9],
        scoreMetric: "time",
        workoutIntent: "for_time",
      };
    default:
      return { kind: "for_time", scoreMetric: "time" };
  }
}

export function parseWorkoutScheme(raw: unknown): WorkoutScheme | null {
  if (raw == null || (typeof raw === "object" && Object.keys(raw as object).length === 0)) {
    return null;
  }
  const parsed = workoutSchemeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function defaultSchemeForMetconFormat(format: string | null): WorkoutScheme | null {
  switch (format) {
    case "for_time":
      return defaultSchemeForKind("for_time");
    case "amrap":
      return defaultSchemeForKind("amrap");
    case "emom":
      return defaultSchemeForKind("emom");
    case "chipper":
      return defaultSchemeForKind("chipper");
    default:
      return null;
  }
}

export function schemeSummaryLabel(scheme: WorkoutScheme | null): string | null {
  if (!scheme) return null;
  const intent =
    scheme.workoutIntent === "for_quality"
      ? " · FQ"
      : scheme.workoutIntent === "for_completion"
        ? " · Completion"
        : "";
  switch (scheme.kind) {
    case "rft":
      return `${scheme.rounds} RFT${intent}`;
    case "for_time":
      return `For time${intent}`;
    case "amrap":
      return `AMRAP ${scheme.timeCapMin}${intent}`;
    case "amrap_repeat":
      return `AMRAP ${scheme.timeCapMin} × ${scheme.rounds}${intent}`;
    case "emom":
      return `EMOM ${scheme.minutes}${intent}`;
    case "emom_completion":
      return `EMOM ${scheme.minutes} (completion)${intent}`;
    case "chipper":
      return `Chipper${intent}`;
    case "interval_series": {
      const m = Math.floor(scheme.intervalSec / 60);
      const s = scheme.intervalSec % 60;
      const interval = s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`;
      return `Every ${interval} × ${scheme.rounds}${intent}`;
    }
    case "tabata":
      return `Tabata ${scheme.workSec}/${scheme.restSec} × ${scheme.rounds}${intent}`;
    case "rep_ladder": {
      const seq = scheme.repSequence.join("-");
      const between = scheme.betweenRounds?.amount
        ? ` + ${scheme.betweenRounds.amount}${scheme.betweenRounds.prescriptionUnit === "meters" ? "m" : ""} ${scheme.betweenRounds.label ?? ""}`
        : "";
      return `${seq}${between}${intent}`;
    }
    default:
      return null;
  }
}

export function normalizeWorkoutSchemeForSave(
  scheme: WorkoutScheme | null | undefined,
  metconFormat: string | null,
): Record<string, unknown> {
  if (scheme) return scheme as Record<string, unknown>;
  const fallback = defaultSchemeForMetconFormat(metconFormat);
  return fallback ? (fallback as Record<string, unknown>) : emptyWorkoutScheme;
}
