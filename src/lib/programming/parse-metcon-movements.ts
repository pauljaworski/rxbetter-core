import type { EditorLineItem } from "@/hooks/staff/types";
import type { BenchmarkCatalogEntry } from "@/lib/wod-parser/types";
import { fuzzyMatchBenchmark } from "@/lib/wod-parser/fuzzy-benchmark";
import { normalizeMetconFormat } from "@/lib/wod-parser/intake-draft-schema";
import { normalizeMovementAlias } from "@/lib/programming/movement-aliases";
import type { PrescriptionUnit } from "@/lib/programming/prescription-unit";
import { inferUnitFromToken } from "@/lib/programming/prescription-unit";
import type { WorkoutScheme } from "./workout-scheme-schema";
import type { LineItemKind } from "./line-item-kind";

export type ParsedMetconMovement = {
  label: string;
  reps_prescribed: number | null;
  prescription_unit: PrescriptionUnit;
  prescribed_score: string | null;
  benchmark_type_id: string | null;
  bench_name?: string;
};

export type ParseMetconResult = {
  movements: ParsedMetconMovement[];
  metconFormat: string | null;
  scheme: WorkoutScheme | null;
  warnings: string[];
};

const RFT_HEADER = /^(\d+)\s*(?:rft|rounds?\s+for\s+time)\s*:?\s*(.*)$/i;
const ROUNDS_HEADER = /^(\d+)\s+rounds?\s*:?\s*(.*)$/i;
const AMRAP_HEADER = /^amrap\s+(\d+)\s*(.*)$/i;
const FOR_TIME_HEADER = /^for\s+time\s*:?\s*(.*)$/i;
const EVERY_HEADER =
  /^every\s+(\d+)(?::(\d+))?\s*(?:x|×)\s*(\d+)\s*(?:rounds?)?\s*:?\s*(.*)$/i;
const REP_LADDER_HEADER = /^([\d]+(?:\s*[-–—]\s*[\d]+)+)\s*:?\s*(.*)$/i;
const AFTER_EACH_ROUND = /,?\s*after\s+each\s+round\s*:?\s*(.+)$/i;

function splitMovementTokens(blob: string): string[] {
  const trimmed = blob.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitLadderBlob(blob: string): { movementsPart: string; betweenPart: string | null } {
  const m = blob.match(AFTER_EACH_ROUND);
  if (!m || m.index == null) {
    return { movementsPart: blob.trim(), betweenPart: null };
  }
  return {
    movementsPart: blob.slice(0, m.index).replace(/,\s*$/, "").trim(),
    betweenPart: m[1].trim(),
  };
}

function parseRxWeights(token: string): { label: string; rx: string | null } {
  const paren = token.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    return { label: paren[1].trim(), rx: paren[2].trim() };
  }
  return { label: token.trim(), rx: null };
}

function parseBetweenRound(token: string) {
  const inferred = inferUnitFromToken(token);
  return {
    amount: inferred.amount,
    prescriptionUnit: inferred.unit,
    label: inferred.label,
  };
}

function parseMovementToken(token: string): {
  reps: number | null;
  unit: PrescriptionUnit;
  label: string;
  rx: string | null;
} {
  const { label: rawLabel, rx } = parseRxWeights(token);
  const inferred = inferUnitFromToken(rawLabel);
  const label = normalizeMovementAlias(inferred.label);
  return {
    reps: inferred.amount,
    unit: inferred.unit,
    label,
    rx,
  };
}

function parseRepSequence(seqStr: string): number[] {
  return seqStr
    .split(/\s*[-–—]\s*/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
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

  let m = line.match(REP_LADDER_HEADER);
  if (m) {
    const repSequence = parseRepSequence(m[1]);
    if (repSequence.length >= 2) {
      metconFormat = "for_time";
      const { movementsPart, betweenPart } = splitLadderBlob(m[2]?.trim() ?? "");
      movementBlob = movementsPart;
      scheme = {
        kind: "rep_ladder",
        repSequence,
        scoreMetric: "time",
        workoutIntent: "for_time",
        betweenRounds: betweenPart ? parseBetweenRound(betweenPart) : undefined,
      };
    }
  }

  if (!scheme) {
    m = line.match(RFT_HEADER);
    if (m) {
      metconFormat = "for_time";
      scheme = { kind: "rft", rounds: Number(m[1]), scoreMetric: "time", workoutIntent: "for_time" };
      movementBlob = m[2]?.trim() || rawText.split(/\n/).slice(1).join(",");
    }
  }

  if (!scheme) {
    m = line.match(ROUNDS_HEADER);
    if (m && /\bfor\s+time|rft\b/i.test(line)) {
      metconFormat = "for_time";
      scheme = { kind: "rft", rounds: Number(m[1]), scoreMetric: "time", workoutIntent: "for_time" };
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
      scheme = { kind: "for_time", scoreMetric: "time", workoutIntent: "for_time" };
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

  const isLadder = scheme?.kind === "rep_ladder";
  const tokens =
    movementBlob && movementBlob !== line
      ? splitMovementTokens(movementBlob)
      : splitMovementTokens(
          rawText
            .replace(
              /^(?:[\d]+\s*[-–—]\s*[\d]+(?:\s*[-–—]\s*[\d]+)*|(?:\d+\s*)?(?:rft|rounds?\s+for\s+time|amrap\s+\d+|for\s+time))\s*:?\s*/i,
              "",
            )
            .replace(AFTER_EACH_ROUND, "")
            .trim(),
        );

  const ladderReps =
    isLadder && scheme?.kind === "rep_ladder" ? scheme.repSequence[0] ?? null : null;

  const movements: ParsedMetconMovement[] = [];
  for (const token of tokens) {
    const { reps, unit, label, rx } = parseMovementToken(token);
    const match = fuzzyMatchBenchmark(label, catalog);
    if (!match) warnings.push(`No catalog match for "${label}".`);
    const rxScore = rx ? (rx.includes("/") ? `${rx} lb` : rx) : null;
    movements.push({
      label,
      reps_prescribed: isLadder ? ladderReps : reps,
      prescription_unit: unit,
      prescribed_score: rxScore,
      benchmark_type_id: match?.id ?? null,
      bench_name: match?.name ?? label,
    });
  }

  if (isLadder && scheme?.kind === "rep_ladder" && scheme.betweenRounds?.label) {
    const br = scheme.betweenRounds;
    const brLabel = normalizeMovementAlias(br.label ?? "Run");
    const brMatch = fuzzyMatchBenchmark(brLabel, catalog);
    if (!brMatch) warnings.push(`No catalog match for between-rounds "${brLabel}".`);
    movements.push({
      label: brLabel,
      reps_prescribed: br.amount ?? null,
      prescription_unit: (br.prescriptionUnit as PrescriptionUnit) ?? "meters",
      prescribed_score: null,
      benchmark_type_id: brMatch?.id ?? null,
      bench_name: brMatch?.name ?? brLabel,
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
    prescription_unit: m.prescription_unit,
    prescribed_weight: null,
    prescribed_percentage: null,
    prescribed_score: m.prescribed_score,
    benchmark_type_id: m.benchmark_type_id,
    bench_name: m.bench_name,
    movement_label: m.benchmark_type_id ? null : m.label,
    line_item_kind: "metcon_movement" as LineItemKind,
    movement_components: [],
  }));
}
