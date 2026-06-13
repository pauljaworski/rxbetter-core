export type BenchmarkCatalogEntry = {
  id: string;
  name: string;
};

export type BenchmarkDefinitionEntry = {
  id: string;
  benchmark_type_id: string;
  rep_count: number;
};

function normalizeMovementName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fuzzy-match a movement label to the benchmark catalog. */
export function matchBenchmarkType(
  label: string,
  catalog: BenchmarkCatalogEntry[],
): BenchmarkCatalogEntry | null {
  const n = normalizeMovementName(label);
  if (!n) return null;

  const exact = catalog.find((c) => normalizeMovementName(c.name) === n);
  if (exact) return exact;

  const contains = catalog.filter(
    (c) =>
      normalizeMovementName(c.name).includes(n) ||
      n.includes(normalizeMovementName(c.name)),
  );
  if (contains.length === 1) return contains[0];

  const tokenHits = catalog
    .map((c) => {
      const cn = normalizeMovementName(c.name);
      const words = n.split(" ").filter((w) => w.length > 2);
      const hits = words.filter((w) => cn.includes(w)).length;
      return { c, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (tokenHits.length === 1 || (tokenHits.length > 1 && tokenHits[0].hits > tokenHits[1].hits)) {
    return tokenHits[0].c;
  }
  return null;
}

export function resolveDefinitionId(
  benchmarkTypeId: string,
  repCount: number,
  definitions: BenchmarkDefinitionEntry[],
): string | null {
  const hit = definitions.find(
    (d) => d.benchmark_type_id === benchmarkTypeId && d.rep_count === repCount,
  );
  return hit?.id ?? null;
}
