import type { EditorLineItem, IntakeDraftPayload } from "@/hooks/staff/types";
import { normalizePercentFraction } from "@/lib/programming/percent-calculator";
import { fuzzyMatchBenchmark } from "./fuzzy-benchmark";
import {
  type LlmIntakeDraft,
  llmIntakeDraftSchema,
  normalizeMetconFormat,
  normalizeProgrammingSegment,
} from "./intake-draft-schema";
import type { BenchmarkCatalogEntry } from "./types";

export type MapLlmDraftOptions = {
  llm: unknown;
  catalog: BenchmarkCatalogEntry[];
  defaultLibraryId: string | null;
  displayOrder: number;
  meta?: IntakeDraftPayload["_meta"];
};

/** Convert validated LLM JSON → IntakeDraftPayload with catalog fuzzy match. */
export function mapLlmToIntakeDraft(options: MapLlmDraftOptions): IntakeDraftPayload | null {
  const parsed = llmIntakeDraftSchema.safeParse(options.llm);
  if (!parsed.success) return null;

  const { segment, movements, warnings } = parsed.data;
  const programming_segment = normalizeProgrammingSegment(segment.programming_segment);
  const metcon_format = normalizeMetconFormat(segment.metcon_format ?? null);

  const lineItems: EditorLineItem[] = movements.map((m, idx) => {
    const match = fuzzyMatchBenchmark(m.name, options.catalog);
    const extraWarnings: string[] = [];
    if (!match) extraWarnings.push(`No catalog match for "${m.name}".`);

    let pct = m.prescribed_percentage ?? null;
    if (pct != null && pct > 1) pct = pct / 100;
    pct = normalizePercentFraction(pct);

    return {
      sequence_number: m.sequence_number ?? idx + 1,
      reps_prescribed: m.reps_prescribed ?? null,
      prescribed_weight: m.prescribed_weight ?? null,
      prescribed_percentage: pct,
      prescribed_score: m.prescribed_score ?? null,
      benchmark_type_id: match?.id ?? null,
      bench_name: match?.name ?? m.name,
    };
  });

  const allWarnings = [...warnings];
  for (const it of lineItems) {
    if (!it.benchmark_type_id && programming_segment === "weightlifting") {
      allWarnings.push(`Pick a catalog match for "${it.bench_name}".`);
    }
  }

  return {
    segment: {
      name: segment.name ?? "Workout",
      description: segment.description ?? null,
      programming_segment,
      metcon_format,
      athlete_notes: segment.athlete_notes ?? null,
      coaches_notes: segment.coaches_notes ?? null,
      display_order: options.displayOrder,
      program_library_id: options.defaultLibraryId,
      program_library_ids: options.defaultLibraryId ? [options.defaultLibraryId] : [],
      items: [],
    },
    lineItems,
    warnings: allWarnings,
    unmatchedTokens: lineItems.filter((i) => !i.benchmark_type_id).map((i) => i.bench_name ?? ""),
    _meta: options.meta,
  };
}

export function parseLlmJsonFromText(text: string): LlmIntakeDraft | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const raw = JSON.parse(jsonMatch[0]) as unknown;
    const parsed = llmIntakeDraftSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
