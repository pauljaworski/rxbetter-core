import { z } from "zod";
import { parseScoreToSeconds } from "@/lib/programming/metcon-score";
import type { WorkoutScheme } from "@/lib/programming/workout-scheme-schema";

export type RftEntryMode = "splits" | "total_in_last_round";

export const rftScoreMetaSchema = z.object({
  version: z.literal(1),
  schemeKind: z.literal("rft"),
  rounds: z.number().int(),
  restBetweenRoundsSec: z.number().int(),
  restTotalSec: z.number().int(),
  roundWorkingTimesSec: z.array(z.number().nullable()),
  entryMode: z.enum(["splits", "total_in_last_round"]),
  derived: z.object({
    workingTimeSec: z.number().int(),
  }),
});

export type RftScoreMeta = z.infer<typeof rftScoreMetaSchema>;

export function rftRestTotalSec(rounds: number, restBetweenRoundsSec: number): number {
  if (rounds <= 1 || restBetweenRoundsSec <= 0) return 0;
  return (rounds - 1) * restBetweenRoundsSec;
}

export function rftUsesRoundSplits(
  scheme: WorkoutScheme | null,
): scheme is Extract<WorkoutScheme, { kind: "rft" }> {
  return scheme?.kind === "rft" && (scheme.restBetweenRoundsSec ?? 0) > 0;
}

export function parseRftScoreMeta(raw: unknown): RftScoreMeta | null {
  if (raw == null) return null;
  const parsed = rftScoreMetaSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function formatSecondsToMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatRestLabel(restSec: number): string {
  if (restSec <= 0) return "";
  if (restSec < 60) return `${restSec}s`;
  const m = Math.floor(restSec / 60);
  const s = restSec % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`;
}

export function emptyRoundInputs(rounds: number): string[] {
  return Array.from({ length: rounds }, () => "");
}

export function roundInputsFromMeta(meta: RftScoreMeta | null, rounds: number): string[] {
  if (!meta?.roundWorkingTimesSec?.length) return emptyRoundInputs(rounds);
  return Array.from({ length: rounds }, (_, i) => {
    const sec = meta.roundWorkingTimesSec[i];
    return sec != null ? formatSecondsToMmSs(sec) : "";
  });
}

export type DeriveRftResult = {
  workingTimeSec: number;
  entryMode: RftEntryMode;
  roundWorkingTimesSec: (number | null)[];
  restTotalSec: number;
};

export function deriveRftWorkingTime(
  rounds: number,
  restBetweenRoundsSec: number,
  roundInputStrings: string[],
): { ok: true; result: DeriveRftResult } | { ok: false; error: string } {
  if (rounds < 1) {
    return { ok: false, error: "Invalid round count" };
  }

  const restTotalSec = rftRestTotalSec(rounds, restBetweenRoundsSec);
  const parsed: (number | null)[] = [];

  for (let i = 0; i < rounds; i++) {
    const raw = (roundInputStrings[i] ?? "").trim();
    if (!raw) {
      parsed.push(null);
      continue;
    }
    const sec = parseScoreToSeconds(raw);
    if (sec == null || sec < 0) {
      return { ok: false, error: "Enter valid times as mm:ss (e.g. 3:45)" };
    }
    parsed.push(sec);
  }

  const early = parsed.slice(0, Math.max(0, rounds - 1));
  const last = rounds > 0 ? parsed[rounds - 1] : null;
  const anyEarly = early.some((v) => v != null);

  if (!anyEarly && last != null) {
    return {
      ok: true,
      result: {
        workingTimeSec: last,
        entryMode: "total_in_last_round",
        roundWorkingTimesSec: parsed.map((v, i) => (i === rounds - 1 ? last : null)),
        restTotalSec,
      },
    };
  }

  if (!anyEarly && last == null) {
    return {
      ok: false,
      error: "Enter at least one round time, or total working time in the last round",
    };
  }

  if (!parsed.every((v) => v != null)) {
    return {
      ok: false,
      error:
        "Fill every round split, or leave earlier rounds blank and enter total working time in the last round",
    };
  }

  const sum = parsed.reduce((acc, v) => acc + (v ?? 0), 0);
  return {
    ok: true,
    result: {
      workingTimeSec: sum,
      entryMode: "splits",
      roundWorkingTimesSec: parsed,
      restTotalSec,
    },
  };
}

export function buildRftScoreMeta(
  rounds: number,
  restBetweenRoundsSec: number,
  derived: DeriveRftResult,
): RftScoreMeta {
  return {
    version: 1,
    schemeKind: "rft",
    rounds,
    restBetweenRoundsSec,
    restTotalSec: derived.restTotalSec,
    roundWorkingTimesSec: derived.roundWorkingTimesSec,
    entryMode: derived.entryMode,
    derived: { workingTimeSec: derived.workingTimeSec },
  };
}
