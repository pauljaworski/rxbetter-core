import type { EditorLineItem } from "@/hooks/staff/types";
import type { BenchmarkCatalogEntry } from "@/lib/wod-parser/types";
import { fuzzyMatchBenchmark } from "@/lib/wod-parser/fuzzy-benchmark";
import { normalizeMetconFormat } from "@/lib/wod-parser/intake-draft-schema";
import type { WorkoutScheme } from "./workout-scheme-schema";
import type { LineItemKind } from "./line-item-kind";

export type ParsedMetconMovement = {
  label: string;
  reps_prescribed: number | null;
  benchmark_type_id: string | null;
  bench_name?: string;
};

export type ParseMetconResult = {
  movements: ParsedMetconMovement[];
  metconFormat: string | null;
  scheme: WorkoutScheme | null;
  warnings: string[];
};

const RFT_HEADER =
  /^(\d+)\s*(?:rft|rounds?\s+for\s+time)\s*:?\s*(.*)$/i;
const ROUNDS_HEADER = /^(\d+)\s+rounds?\s*:?\s*(.*)$/i;
const AMRAP_HEADER = /^amrap\s+(\d+)\s*(.*)$/i;
const FOR_TIME_HEADER = /^for\s+time\s*:?\s*(.*)$/i;
const EVERY_HEADER =
  /^every\s+(\d+)(?::(\d+))?\s*(?:x|×)\s*(\d+)\s*(?:rounds?)?\s*:?\s*(.*)$/i;

function splitMovementTokens(blob: string): string[] {
  const trimmed = blob.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseRepsFromToken(token: string): { reps: number | null; label: string } {
  const t = token.trim();
  const distanceM = t.match(/^(\d+)\s*m(?:eter)?s?\s+(.+)$/i);
  if (distanceM) {
    return { reps: Number(distanceM[1]), label: distanceM[2].trim() };
  }
  const distanceCal = t.match(/^(\d+)\s*(?:\/\d+\s*)?cal(?:ories)?\s+(.+)$/i);
  if (distanceCal) {
    return { reps: Number(distanceCal[1]), label: distanceCal[2].trim() };
  }
  const repsFirst = t.match(/^(\d+)\s+(.+)$/);
  if (repsFirst) {
    return { reps: Number(repsFirst[1]), label: repsFirst[2].trim() };
  }
  return { reps: null, label: t };
}

export function parseMetconMovements(
  rawText: string,
  catalog: BenchmarkCatalogEntry[],
): ParseMetconResult {
  const warnings: string[] = [];
  const line = rawText.trim().split(/\n/)[0]?.trim() ?? "";
  let movementBlob = line;
  let metconFormat: string | null = null;
  let scheme: WorkoutScheme | null = null;

  let m = line.match(RFT_HEADER);
  if (m) {
    metconFormat = "for_time";
    scheme = { kind: "rft", rounds: Number(m[1]), scoreMetric: "time" };
    movementBlob = m[2]?.trim() || rawText.split(/\n/).slice(1).join(",");
  }

  if (!scheme) {
    m = line.match(ROUNDS_HEADER);
    if (m && /\bfor\s+time|rft\b/i.test(line)) {
      metconFormat = "for_time";
      scheme = { kind: "rft", rounds: Number(m[1]), scoreMetric: "time" };
      movementBlob = m[2]?.trim() || "";
    }
  }

  if (!scheme) {
    m = line.match(AMRAP_HEADER);
    if (m) {
      metconFormat = "amrap";
      scheme = {
        kind: "amrap",
        timeCapMin: Number(m[1]),
        scoreMetric: "rounds_reps",
      };
      movementBlob = m[2]?.trim() || rawText.split(/\n/).slice(1).join(",");
    }
  }

  if (!scheme) {
    m = line.match(EVERY_HEADER);
    if (m) {
      metconFormat = "emom";
      const min = Number(m[1]);
      const sec = m[2] ? Number(m[2]) : 0;
      const intervalSec = min * 60 + sec;
      scheme = {
        kind: "interval_series",
        intervalSec,
        rounds: Number(m[3]),
        scoreMetric: "sum_interval_times",
      };
      movementBlob = m[4]?.trim() || rawText.split(/\n/).slice(1).join(",");
    }
  }

  if (!scheme) {
    m = line.match(FOR_TIME_HEADER);
    if (m) {
      metconFormat = "for_time";
      scheme = { kind: "for_time", scoreMetric: "time" };
      movementBlob = m[1]?.trim() || rawText.split(/\n/).slice(1).join(",");
    }
  }

  if (!metconFormat && /\b(amrap|for\s+time|emom|rft|tabata|chipper)\b/i.test(line)) {
    if (/\bamrap\b/i.test(line)) metconFormat = "amrap";
    else if (/\b(emom|every\s+\d+)\b/i.test(line)) metconFormat = "emom";
    else if (/\b(chipper)\b/i.test(line)) metconFormat = "chipper";
    else metconFormat = "for_time";
  }

  metconFormat = normalizeMetconFormat(metconFormat);

  const tokens =
    movementBlob && movementBlob !== line
      ? splitMovementTokens(movementBlob)
      : splitMovementTokens(
          rawText
            .replace(/^(?:\d+\s*)?(?:rft|rounds?\s+for\s+time|amrap\s+\d+|for\s+time)\s*:?\s*/i, "")
            .trim(),
        );

  const movements: ParsedMetconMovement[] = [];
  for (const token of tokens) {
    const { reps, label } = parseRepsFromToken(token);
    const match = fuzzyMatchBenchmark(label, catalog);
    if (!match) warnings.push(`No catalog match for "${label}".`);
    movements.push({
      label,
      reps_prescribed: reps,
      benchmark_type_id: match?.id ?? null,
      bench_name: match?.name ?? label,
    });
  }

  return { movements, metconFormat, scheme, warnings };
}

export function editorLineItemsFromMetconMovements(
  parsed: ParsedMetconMovement[],
  startSeq = 1,
): EditorLineItem[] {
  return parsed.map((m, i) => ({
    sequence_number: startSeq + i,
    reps_prescribed: m.reps_prescribed,
    prescribed_weight: null,
    prescribed_percentage: null,
    prescribed_score: null,
    benchmark_type_id: m.benchmark_type_id,
    bench_name: m.bench_name,
    movement_label: m.benchmark_type_id ? null : m.label,
    line_item_kind: "metcon_movement" as LineItemKind,
    movement_components: [],
  }));
}
