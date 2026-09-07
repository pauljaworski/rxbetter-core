import { z } from "zod";
import { parseScoreToSeconds } from "@/lib/programming/metcon-score";
import {
  emptyRoundInputs,
  formatSecondsToMmSs,
} from "@/lib/programming/rft-score";
import type { WorkoutScheme } from "@/lib/programming/workout-scheme-schema";

export const intervalScoreMetaSchema = z.object({
  version: z.literal(1),
  schemeKind: z.literal("interval_series"),
  rounds: z.number().int(),
  intervalSec: z.number().int(),
  roundTimesSec: z.array(z.number().nullable()),
  derived: z.object({
    totalTimeSec: z.number().int(),
  }),
});

export type IntervalScoreMeta = z.infer<typeof intervalScoreMetaSchema>;

export function isIntervalSeriesScheme(
  scheme: WorkoutScheme | null,
): scheme is Extract<WorkoutScheme, { kind: "interval_series" }> {
  return scheme?.kind === "interval_series";
}

export function parseIntervalScoreMeta(raw: unknown): IntervalScoreMeta | null {
  if (raw == null) return null;
  const parsed = intervalScoreMetaSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function intervalRoundInputsFromMeta(
  meta: IntervalScoreMeta | null,
  rounds: number,
): string[] {
  if (!meta?.roundTimesSec?.length) return emptyRoundInputs(rounds);
  return Array.from({ length: rounds }, (_, i) => {
    const sec = meta.roundTimesSec[i];
    return sec != null ? formatSecondsToMmSs(sec) : "";
  });
}

export type DeriveIntervalResult = {
  totalTimeSec: number;
  roundTimesSec: number[];
};

export function deriveIntervalTotalTime(
  rounds: number,
  roundInputStrings: string[],
): { ok: true; result: DeriveIntervalResult } | { ok: false; error: string } {
  if (rounds < 1) {
    return { ok: false, error: "Invalid round count" };
  }

  const parsed: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const raw = (roundInputStrings[i] ?? "").trim();
    if (!raw) {
      return { ok: false, error: `Enter a time for interval ${i + 1}` };
    }
    const sec = parseScoreToSeconds(raw);
    if (sec == null || sec < 0) {
      return { ok: false, error: "Enter valid times as mm:ss or seconds (e.g. 3:45 or 225)" };
    }
    parsed.push(sec);
  }

  const totalTimeSec = parsed.reduce((acc, v) => acc + v, 0);
  return {
    ok: true,
    result: { totalTimeSec, roundTimesSec: parsed },
  };
}

export function buildIntervalScoreMeta(
  rounds: number,
  intervalSec: number,
  derived: DeriveIntervalResult,
): IntervalScoreMeta {
  return {
    version: 1,
    schemeKind: "interval_series",
    rounds,
    intervalSec,
    roundTimesSec: derived.roundTimesSec,
    derived: { totalTimeSec: derived.totalTimeSec },
  };
}
