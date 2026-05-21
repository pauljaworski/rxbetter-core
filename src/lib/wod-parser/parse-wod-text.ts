import type { EditorLineItem, EditorWod } from "@/hooks/staff/types";
import { fuzzyMatchBenchmark } from "./fuzzy-benchmark";
import {
  METCON_KEYWORDS,
  SETS_REPS_PCT,
  STRENGTH_REPS_AT_WEIGHT,
  STRENGTH_SETS_REPS_PCT,
} from "./regex-patterns";
import type { ParseWodOptions, ParseWodResult } from "./types";

function emptySegment(libId: string | null, order: number): EditorWod {
  return {
    name: "New segment",
    description: "",
    programming_segment: "strength",
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
    return { segment: "metcon", metconFormat };
  }
  return { segment: "strength", metconFormat: null };
}

function parseStrengthLine(
  line: string,
  catalog: ParseWodOptions["catalog"],
): { movement: string; item: EditorLineItem; warnings: string[] } | null {
  const warnings: string[] = [];

  let m = line.match(STRENGTH_SETS_REPS_PCT);
  if (m) {
    const movement = m[1].trim();
    const sets = Number(m[2]);
    const reps = Number(m[3]);
    const pct = m[4] != null ? Number(m[4]) / 100 : null;
    const match = fuzzyMatchBenchmark(movement, catalog);
    if (!match) warnings.push(`No catalog match for "${movement}".`);
    return {
      movement,
      item: {
        sequence_number: 1,
        reps_prescribed: reps * sets,
        prescribed_weight: null,
        prescribed_percentage: pct,
        prescribed_score: `${sets}x${reps}${pct != null ? ` @ ${m[4]}%` : ""}`,
        benchmark_type_id: match?.id ?? null,
        bench_name: match?.name ?? movement,
      },
      warnings,
    };
  }

  m = line.match(STRENGTH_REPS_AT_WEIGHT);
  if (m) {
    const movement = m[1].trim();
    const reps = Number(m[2]);
    const weight = Number(m[3]);
    const match = fuzzyMatchBenchmark(movement, catalog);
    if (!match) warnings.push(`No catalog match for "${movement}".`);
    return {
      movement,
      item: {
        sequence_number: 1,
        reps_prescribed: reps,
        prescribed_weight: weight,
        prescribed_percentage: null,
        prescribed_score: `${reps} @ ${weight}`,
        benchmark_type_id: match?.id ?? null,
        bench_name: match?.name ?? movement,
      },
      warnings,
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

  const firstLine = lines[0];
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

  const parsed = parseStrengthLine(firstLine, options.catalog);
  if (!parsed) {
    return {
      draft: null,
      needsLlmFallback: true,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  const description = lines.slice(1).join("\n");
  const seg: EditorWod = {
    ...emptySegment(options.defaultLibraryId, options.displayOrder ?? 0),
    name: parsed.movement,
    description: description || null,
    programming_segment: "strength",
  };

  const warnings = [...parsed.warnings];
  if (!parsed.item.benchmark_type_id) {
    warnings.push("Pick a movement from the catalog before saving.");
  }

  return {
    draft: {
      segment: seg,
      lineItems: [parsed.item],
      warnings,
      unmatchedTokens: parsed.item.benchmark_type_id ? undefined : [parsed.movement],
    },
    needsLlmFallback: false,
    latencyMs: Math.round(performance.now() - start),
  };
}
