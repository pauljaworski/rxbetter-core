import type { EditorLineItem, EditorWod } from "@/hooks/staff/types";
import { normalizePercentFraction } from "@/lib/programming/percent-calculator";
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
import {
  editorLineItemsFromMetconMovements,
  parseMetconMovements,
} from "@/lib/programming/parse-metcon-movements";
import { schemeSummaryLabel } from "@/lib/programming/workout-scheme-schema";

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
    program_library_ids: libId ? [libId] : [],
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
    const pct = normalizePercentFraction(percentages[s - 1] ?? percentages[0] ?? null);
    items.push({
      sequence_number: s,
      reps_prescribed: reps,
      prescribed_weight: null,
      prescribed_percentage: pct,
      prescribed_score: null,
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
      const pct = normalizePercentFraction(percentages[s] ?? null);
      lineItems.push({
        sequence_number: s + 1,
        reps_prescribed: reps,
        prescribed_weight: null,
        prescribed_percentage: pct,
        prescribed_score: null,
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
          prescribed_score: null,
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
    const parsed = parseMetconMovements(options.rawText, options.catalog);
    const lineItems = editorLineItemsFromMetconMovements(parsed.movements);
    const format = parsed.metconFormat ?? metconFormat;
    const schemeLabel = parsed.scheme ? schemeSummaryLabel(parsed.scheme) : null;
    const draft = {
      segment: {
        ...emptySegment(options.defaultLibraryId, options.displayOrder ?? 0),
        name: schemeLabel ?? "Metcon",
        description: options.rawText.trim(),
        programming_segment: "metcon",
        metcon_format: format,
        workout_scheme: parsed.scheme,
      },
      lineItems,
      warnings: parsed.warnings,
    };
    const needsLlmFallback = lineItems.length === 0;
    return {
      draft,
      needsLlmFallback,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  const parsedBlocks: StrengthParseResult[] = [];
  const leftover: string[] = [];
  for (const line of lines) {
    const parsed = parseStrengthLine(line, options.catalog);
    if (parsed) parsedBlocks.push(parsed);
    else leftover.push(line);
  }

  if (!parsedBlocks.length) {
    return {
      draft: null,
      needsLlmFallback: true,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  const lineItems: EditorLineItem[] = [];
  for (const block of parsedBlocks) {
    for (const it of block.lineItems) {
      lineItems.push({ ...it, sequence_number: lineItems.length + 1 });
    }
  }

  const names: string[] = [];
  for (const block of parsedBlocks) {
    if (!names.includes(block.movement)) names.push(block.movement);
  }
  const descriptionParts = [
    ...parsedBlocks.map((b) => b.schemeSummary).filter((s): s is string => Boolean(s)),
    ...leftover,
  ];
  const seg: EditorWod = {
    ...emptySegment(options.defaultLibraryId, options.displayOrder ?? 0),
    name: names.length === 1 ? names[0] : names.join(" · "),
    description: descriptionParts.length ? descriptionParts.join("\n") : null,
    programming_segment: "weightlifting",
  };

  const warnings = parsedBlocks.flatMap((b) => b.warnings);
  if (lineItems.some((it) => !it.benchmark_type_id)) {
    warnings.push("Pick a movement from the catalog before saving.");
  }
  if (leftover.length) {
    warnings.push("Some lines were not turned into movements.");
  }

  const unmatched = [
    ...new Set(
      lineItems
        .filter((it) => !it.benchmark_type_id)
        .map((it) => it.bench_name ?? "")
        .filter(Boolean),
    ),
  ];

  // A later line that still looks like sets×reps was not structured. Bulk intake
  // skips AI when needsLlmFallback is false, so flag it and keep the lines we did parse.
  const unparsedPrescription = leftover.some(
    (line) => /\d+\s*x\s*\d+/i.test(line) || /\d+\s*@\s*\d+/.test(line),
  );

  return {
    draft: {
      segment: seg,
      lineItems,
      warnings,
      unmatchedTokens: unmatched.length ? unmatched : undefined,
    },
    needsLlmFallback: unparsedPrescription,
    latencyMs: Math.round(performance.now() - start),
  };
}
