import type { EditorLineItem, EditorWod } from "@/hooks/staff/types";
import { fuzzyMatchBenchmark } from "./fuzzy-benchmark";
import { normalizeMetconFormat } from "./intake-draft-schema";
import {
  METCON_KEYWORDS,
  STRENGTH_REPS_AT_WEIGHT,
  STRENGTH_SETS_REPS,
  STRENGTH_SETS_REPS_LADDER,
  STRENGTH_SETS_REPS_PCT,
} from "./regex-patterns";
import type { ParseWodOptions, ParseWodResult } from "./types";

function emptySegment(libId: string | null, order: number): EditorWod {
  return {
    name: "New segment",
    description: "",
    programming_segment: "weightlifting",
    metcon_format: null,
    athlete_notes: null,
    coaches_notes: null,
    display_order: order,
    program_library_id: libId,
    items: [],
  };
}

function detectSegment(line: string): { segment: string; metconFormat: string | null } {
  if (METCON_KEYWORDS.test(line)) {
    let metconFormat: string | null = "amrap";
    if (/\bfor\s+time\b/i.test(line)) metconFormat = "for_time";
    else if (/\bemom\b/i.test(line)) metconFormat = "emom";
    else if (/\brft\b/i.test(line)) metconFormat = "rft";
    else if (/\btabata\b/i.test(line)) metconFormat = "tabata";
    else if (/\bchipper\b/i.test(line)) metconFormat = "chipper";
    return { segment: "metcon", metconFormat: normalizeMetconFormat(metconFormat) };
  }
  return { segment: "weightlifting", metconFormat: null };
}

function normalizeMovementName(raw: string): string {
  return raw
    .trim()
    .replace(/^\+\s*/, "")
    .replace(/\s*\+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse "65,70,75,80,85" or "65%/70%/80%" into 0–1 decimals. */
function parsePercentLadder(raw: string): number[] {
  const nums = raw.match(/\d+(?:\.\d+)?/g);
  if (!nums?.length) return [];
  return nums.map((n) => {
    const v = Number(n);
    return v > 1 ? v / 100 : v;
  });
}

function formatPctDisplay(decimal: number): string {
  const n = decimal <= 1 ? Math.round(decimal * 1000) / 10 : decimal;
  return Number.isInteger(n) ? String(n) : String(n);
}

type StrengthParseResult = {
  movement: string;
  lineItems: EditorLineItem[];
  warnings: string[];
  schemeSummary: string | null;
};

function buildPerSetLineItems(options: {
  sets: number;
  reps: number;
  percentages: (number | null)[];
  benchmark_type_id: string | null;
  bench_name: string;
}): EditorLineItem[] {
  const { sets, reps, percentages, benchmark_type_id, bench_name } = options;
  const items: EditorLineItem[] = [];

  for (let s = 1; s <= sets; s++) {
    const pct = percentages[s - 1] ?? percentages[0] ?? null;
    const pctLabel = pct != null ? ` @ ${formatPctDisplay(pct)}%` : "";
    items.push({
      sequence_number: s,
      reps_prescribed: reps,
      prescribed_weight: null,
      prescribed_percentage: pct,
      prescribed_score: `${reps}${pctLabel}`,
      benchmark_type_id,
      bench_name,
    });
  }

  return items;
}

function parseStrengthLine(
  line: string,
  catalog: ParseWodOptions["catalog"],
): StrengthParseResult | null {
  const warnings: string[] = [];
  const trimmed = line.trim().replace(/^\+\s*/, "");

  let m = trimmed.match(STRENGTH_SETS_REPS_PCT);
  if (m) {
    const movement = normalizeMovementName(m[1]);
    const sets = Number(m[2]);
    const reps = Number(m[3]);
    const pct = Number(m[4]) / 100;
    const match = fuzzyMatchBenchmark(movement, catalog);
    if (!match) warnings.push(`No catalog match for "${movement}".`);
    const benchId = match?.id ?? null;
    const benchName = match?.name ?? movement;
    return {
      movement,
      lineItems: buildPerSetLineItems({
        sets,
        reps,
        percentages: Array.from({ length: sets }, () => pct),
        benchmark_type_id: benchId,
        bench_name: benchName,
      }),
      warnings,
      schemeSummary: `${sets}x${reps} @ ${m[4]}%`,
    };
  }

  m = trimmed.match(STRENGTH_SETS_REPS_LADDER);
  if (m) {
    const movement = normalizeMovementName(m[1]);
    const sets = Number(m[2]);
    const reps = Number(m[3]);
    const ladder = parsePercentLadder(m[4]);
    if (!ladder.length) return null;

    const match = fuzzyMatchBenchmark(movement, catalog);
    if (!match) warnings.push(`No catalog match for "${movement}".`);
    const benchId = match?.id ?? null;
    const benchName = match?.name ?? movement;

    if (ladder.length !== sets) {
      warnings.push(
        `Found ${ladder.length} percentages for ${sets} sets — using one line item per listed %.`,
      );
    }

    const count = Math.max(sets, ladder.length);
    const percentages =
      ladder.length >= count
        ? ladder.slice(0, count)
        : [...ladder, ...Array.from({ length: count - ladder.length }, () => ladder.at(-1) ?? null)];

    const lineItems: EditorLineItem[] = [];
    for (let s = 0; s < count; s++) {
      const pct = percentages[s] ?? null;
      const pctRaw = m[4].match(/\d+(?:\.\d+)?/g)?.[s] ?? "";
      const pctLabel = pct != null ? ` @ ${pctRaw || formatPctDisplay(pct)}%` : "";
      lineItems.push({
        sequence_number: s + 1,
        reps_prescribed: reps,
        prescribed_weight: null,
        prescribed_percentage: pct,
        prescribed_score: `${reps}${pctLabel}`,
        benchmark_type_id: benchId,
        bench_name: benchName,
      });
    }

    return {
      movement,
      lineItems,
      warnings,
      schemeSummary: `${sets}x${reps} ${m[4].trim()}`,
    };
  }

  m = trimmed.match(STRENGTH_SETS_REPS);
  if (m) {
    const movement = normalizeMovementName(m[1]);
    const sets = Number(m[2]);
    const reps = Number(m[3]);
    const match = fuzzyMatchBenchmark(movement, catalog);
    if (!match) warnings.push(`No catalog match for "${movement}".`);
    return {
      movement,
      lineItems: buildPerSetLineItems({
        sets,
        reps,
        percentages: Array.from({ length: sets }, () => null),
        benchmark_type_id: match?.id ?? null,
        bench_name: match?.name ?? movement,
      }),
      warnings,
      schemeSummary: `${sets}x${reps}`,
    };
  }

  m = trimmed.match(STRENGTH_REPS_AT_WEIGHT);
  if (m) {
    const movement = normalizeMovementName(m[1]);
    const reps = Number(m[2]);
    const weight = Number(m[3]);
    const match = fuzzyMatchBenchmark(movement, catalog);
    if (!match) warnings.push(`No catalog match for "${movement}".`);
    return {
      movement,
      lineItems: [
        {
          sequence_number: 1,
          reps_prescribed: reps,
          prescribed_weight: weight,
          prescribed_percentage: null,
          prescribed_score: `${reps} @ ${weight}`,
          benchmark_type_id: match?.id ?? null,
          bench_name: match?.name ?? movement,
        },
      ],
      warnings,
      schemeSummary: null,
    };
  }

  return null;
}

/**
 * Deterministic plain-text → one programming segment + line items.
 */
export function parseWodText(options: ParseWodOptions): ParseWodResult {
  const start = performance.now();
  const lines = options.rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { draft: null, needsLlmFallback: false, latencyMs: 0 };
  }

  const { segment, metconFormat } = detectSegment(options.rawText);

  if (segment === "metcon") {
    const draft = {
      segment: {
        ...emptySegment(options.defaultLibraryId, options.displayOrder ?? 0),
        name: "Metcon",
        description: options.rawText.trim(),
        programming_segment: "metcon",
        metcon_format: metconFormat,
      },
      lineItems: [] as EditorLineItem[],
      warnings: [] as string[],
    };
    return {
      draft,
      needsLlmFallback: true,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  const parsed = parseStrengthLine(lines[0], options.catalog);
  if (!parsed) {
    return {
      draft: null,
      needsLlmFallback: true,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  const extraLines = lines.slice(1).join("\n");
  const descriptionParts = [parsed.schemeSummary, extraLines].filter(Boolean);
  const seg: EditorWod = {
    ...emptySegment(options.defaultLibraryId, options.displayOrder ?? 0),
    name: parsed.movement,
    description: descriptionParts.length ? descriptionParts.join("\n") : null,
    programming_segment: "weightlifting",
  };

  const warnings = [...parsed.warnings];
  if (parsed.lineItems.some((it) => !it.benchmark_type_id)) {
    warnings.push("Pick a movement from the catalog before saving.");
  }

  return {
    draft: {
      segment: seg,
      lineItems: parsed.lineItems,
      warnings,
      unmatchedTokens: parsed.lineItems.some((it) => !it.benchmark_type_id)
        ? [parsed.movement]
        : undefined,
    },
    needsLlmFallback: false,
    latencyMs: Math.round(performance.now() - start),
  };
}
