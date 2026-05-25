import { z } from "zod";

export const SCORE_METRICS = [
  "time",
  "rounds_reps",
  "sum_interval_times",
] as const;

export type ScoreMetric = (typeof SCORE_METRICS)[number];

const baseScheme = z.object({
  scoreMetric: z.enum(SCORE_METRICS).optional(),
});

export const rftSchemeSchema = baseScheme.extend({
  kind: z.literal("rft"),
  rounds: z.number().int().min(1).max(99),
  scoreMetric: z.literal("time").default("time"),
});

export const forTimeSchemeSchema = baseScheme.extend({
  kind: z.literal("for_time"),
  scoreMetric: z.literal("time").default("time"),
});

export const amrapSchemeSchema = baseScheme.extend({
  kind: z.literal("amrap"),
  timeCapMin: z.number().int().min(1).max(120),
  scoreMetric: z.literal("rounds_reps").default("rounds_reps"),
});

export const emomSchemeSchema = baseScheme.extend({
  kind: z.literal("emom"),
  minutes: z.number().int().min(1).max(60),
  scoreMetric: z.literal("rounds_reps").default("rounds_reps"),
});

export const chipperSchemeSchema = baseScheme.extend({
  kind: z.literal("chipper"),
  scoreMetric: z.literal("time").default("time"),
});

export const intervalSeriesSchemeSchema = baseScheme.extend({
  kind: z.literal("interval_series"),
  intervalSec: z.number().int().min(30).max(600),
  rounds: z.number().int().min(1).max(30),
  scoreMetric: z.literal("sum_interval_times").default("sum_interval_times"),
});

export const workoutSchemeSchema = z.discriminatedUnion("kind", [
  rftSchemeSchema,
  forTimeSchemeSchema,
  amrapSchemeSchema,
  emomSchemeSchema,
  chipperSchemeSchema,
  intervalSeriesSchemeSchema,
]);

export type WorkoutScheme = z.infer<typeof workoutSchemeSchema>;

export const emptyWorkoutScheme = {} as Record<string, never>;

/** Parse stored JSONB; returns null if empty or invalid. */
export function parseWorkoutScheme(raw: unknown): WorkoutScheme | null {
  if (raw == null || (typeof raw === "object" && Object.keys(raw as object).length === 0)) {
    return null;
  }
  const parsed = workoutSchemeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Infer default scheme from metcon_format when programmer picks format only. */
export function defaultSchemeForMetconFormat(
  format: string | null,
): WorkoutScheme | null {
  switch (format) {
    case "for_time":
      return { kind: "for_time", scoreMetric: "time" };
    case "amrap":
      return { kind: "amrap", timeCapMin: 12, scoreMetric: "rounds_reps" };
    case "emom":
      return { kind: "emom", minutes: 10, scoreMetric: "rounds_reps" };
    case "chipper":
      return { kind: "chipper", scoreMetric: "time" };
    default:
      return null;
  }
}

export function schemeSummaryLabel(scheme: WorkoutScheme | null): string | null {
  if (!scheme) return null;
  switch (scheme.kind) {
    case "rft":
      return `${scheme.rounds} RFT`;
    case "for_time":
      return "For time";
    case "amrap":
      return `AMRAP ${scheme.timeCapMin}`;
    case "emom":
      return `EMOM ${scheme.minutes}`;
    case "chipper":
      return "Chipper";
    case "interval_series": {
      const m = Math.floor(scheme.intervalSec / 60);
      const s = scheme.intervalSec % 60;
      const interval = s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`;
      return `Every ${interval} × ${scheme.rounds}`;
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
