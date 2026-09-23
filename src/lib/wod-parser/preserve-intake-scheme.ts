import type { IntakeDraftPayload } from "@/hooks/staff/types";
import { parseMetconMovements } from "@/lib/programming/parse-metcon-movements";
import {
  parseWorkoutScheme,
  type WorkoutScheme,
} from "@/lib/programming/workout-scheme-schema";

type RecoveredScheme = {
  scheme: WorkoutScheme;
  metconFormat: string | null;
};

function stripMarks(line: string): string {
  return line.replace(/^#{1,3}\s*/, "").trim();
}

function clampInt(raw: string, min: number, max: number): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

/**
 * Headers the line-1 metcon parser misses, but coaches paste often:
 * "20 minute AMRAP", "12-min EMOM", "EMOM 12".
 */
function schemeFromAlternateHeader(line: string): RecoveredScheme | null {
  const minuteAmrap = line.match(/^(\d+)\s*-?\s*min(?:ute)?s?\s+amrap\b/i);
  if (minuteAmrap) {
    const timeCapMin = clampInt(minuteAmrap[1], 1, 120);
    if (timeCapMin == null) return null;
    const scheme = parseWorkoutScheme({
      kind: "amrap",
      timeCapMin,
      scoreMetric: "rounds_reps",
    });
    return scheme ? { scheme, metconFormat: "amrap" } : null;
  }

  const emom = line.match(/^(?:emom\s+(\d+)|(\d+)\s*-?\s*(?:min(?:ute)?s?\s+)?emom)\b/i);
  if (emom) {
    const minutes = clampInt(emom[1] ?? emom[2], 1, 60);
    if (minutes == null) return null;
    const scheme = parseWorkoutScheme({
      kind: "emom",
      minutes,
      scoreMetric: "rounds_reps",
    });
    return scheme ? { scheme, metconFormat: "emom" } : null;
  }

  return null;
}

function recoverWorkoutScheme(rawText: string): RecoveredScheme | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => stripMarks(line))
    .filter(Boolean);

  const fromFull = parseMetconMovements(rawText, []);
  if (fromFull.scheme && parseWorkoutScheme(fromFull.scheme)) {
    return { scheme: fromFull.scheme, metconFormat: fromFull.metconFormat };
  }

  for (const line of lines) {
    const fromLine = parseMetconMovements(line, []);
    if (fromLine.scheme && parseWorkoutScheme(fromLine.scheme)) {
      return { scheme: fromLine.scheme, metconFormat: fromLine.metconFormat };
    }
    const alt = schemeFromAlternateHeader(line);
    if (alt) return alt;
  }

  return null;
}

/**
 * AI intake JSON has no workout_scheme. Saving a metcon then fills
 * AMRAP 12 / EMOM 10 / generic For time. Keep the scheme implied by the paste.
 */
export function preserveIntakeWorkoutScheme(
  draft: IntakeDraftPayload,
  rawText: string,
): IntakeDraftPayload {
  if (parseWorkoutScheme(draft.segment.workout_scheme)) return draft;

  const format = draft.segment.metcon_format;
  const metconish = draft.segment.programming_segment === "metcon" || format != null;
  if (!metconish) return draft;

  const recovered = recoverWorkoutScheme(rawText);
  if (!recovered) return draft;
  if (format && recovered.metconFormat && format !== recovered.metconFormat) return draft;

  return {
    ...draft,
    segment: {
      ...draft.segment,
      workout_scheme: recovered.scheme,
      metcon_format: format ?? recovered.metconFormat,
    },
  };
}
