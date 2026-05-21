/** Rep-max basis for percentage prescriptions (maps to benchmark_definition.rep_count). */
export const PERCENT_REP_MAX_OPTIONS = [
  { repCount: 1, label: "% 1RM" },
  { repCount: 2, label: "% 2RM" },
  { repCount: 3, label: "% 3RM" },
  { repCount: 5, label: "% 5RM" },
  { repCount: 10, label: "% 10RM" },
] as const;

export type PercentRepMax = (typeof PERCENT_REP_MAX_OPTIONS)[number]["repCount"];

export function percentRepMaxLabel(repCount: number | null | undefined): string {
  const opt = PERCENT_REP_MAX_OPTIONS.find((o) => o.repCount === repCount);
  return opt?.label ?? (repCount ? `% ${repCount}RM` : "% RM");
}

/** Whole-number percent (0–100) from stored fraction (0–1). */
export function percentWholeFromFraction(fraction: number | null | undefined): number | null {
  if (fraction == null || Number.isNaN(fraction)) return null;
  return Math.round(fraction * 100);
}

/** Stored fraction from whole-number percent input. */
export function percentFractionFromWhole(whole: number | null | undefined): number | null {
  if (whole == null || Number.isNaN(whole)) return null;
  const w = Math.round(Number(whole));
  if (w < 0 || w > 100) return null;
  return w / 100;
}

/** Normalize a stored fraction to a whole-percent basis (avoids 0.799999… display). */
export function normalizePercentFraction(fraction: number | null | undefined): number | null {
  return percentFractionFromWhole(percentWholeFromFraction(fraction ?? null));
}

export function computeWeightFromPr(prWeight: number | null, percentage: number | null): number | null {
  if (prWeight == null || percentage == null) return null;
  const pct = normalizePercentFraction(percentage) ?? percentage;
  return Math.round(prWeight * pct * 10) / 10;
}

export type BenchmarkDefinitionRow = {
  id: string;
  benchmark_type_id: string;
  rep_count: number;
};

/** Key: `${benchmark_type_id}:${rep_count}` */
export function buildDefinitionMap(rows: BenchmarkDefinitionRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    m.set(`${r.benchmark_type_id}:${r.rep_count}`, r.id);
  }
  return m;
}

export function resolveDefinitionId(
  map: Map<string, string>,
  benchmarkTypeId: string | null,
  repCount: number | null | undefined,
): string | null {
  if (!benchmarkTypeId || repCount == null) return null;
  return map.get(`${benchmarkTypeId}:${repCount}`) ?? null;
}

export function repCountFromDefinition(
  byId: Map<string, BenchmarkDefinitionRow>,
  definitionId: string | null,
): number | null {
  if (!definitionId) return null;
  return byId.get(definitionId)?.rep_count ?? null;
}
