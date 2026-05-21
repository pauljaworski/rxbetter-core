export type BenchmarkCatalogEntry = { id: string; name: string; stimulus: string | null };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(" ").filter(Boolean));
}

export function scoreBenchmarkMatch(query: string, candidate: BenchmarkCatalogEntry): number {
  const q = normalize(query);
  const c = normalize(candidate.name);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q) || q.includes(c)) return 0.92;

  const qTokens = tokenSet(q);
  const cTokens = tokenSet(c);
  if (!qTokens.size || !cTokens.size) return 0;

  let overlap = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) overlap += 1;
  }
  const union = new Set([...qTokens, ...cTokens]).size;
  return overlap / union;
}

const MIN_SCORE = 0.45;

export function fuzzyMatchBenchmark(
  movementName: string,
  catalog: BenchmarkCatalogEntry[],
): { id: string; name: string; score: number } | null {
  if (!movementName.trim() || !catalog.length) return null;

  let best: { id: string; name: string; score: number } | null = null;
  for (const b of catalog) {
    const score = scoreBenchmarkMatch(movementName, b);
    if (!best || score > best.score) {
      best = { id: b.id, name: b.name, score };
    }
  }
  return best && best.score >= MIN_SCORE ? best : null;
}
