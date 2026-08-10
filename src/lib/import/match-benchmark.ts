export type BenchmarkCatalogEntry = {
  id: string;
  name: string;
};

export type BenchmarkDefinitionEntry = {
  id: string;
  benchmark_type_id: string;
  rep_count: number;
};

/** Common export abbreviations → catalog names (normalized keys). */
const MOVEMENT_ALIASES: Record<string, string> = {
  "kb swing": "kettlebell swing",
  kbs: "kettlebell swing",
  "c and j": "clean and jerk",
  "c j": "clean and jerk",
  ohs: "overhead squat",
  hspu: "handstand push up",
  "strict hspu": "handstand push up",
  "handstand pushups": "handstand push up",
  "handstand push ups": "handstand push up",
  ctb: "chest to bar",
  "ctb pull up": "chest to bar pull up",
  "chest to bar pull ups": "chest to bar pull up",
  t2b: "toes to bar",
  ttb: "toes to bar",
  "toes to bars": "toes to bar",
  du: "double under",
  "double unders": "double under",
  mu: "muscle up",
  "muscle ups": "muscle up",
  "bar mu": "bar muscle up",
  "ring mu": "ring muscle up",
};

function normalizeMovementName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Conservative singularization of the final word for plural export labels. */
function singularizePhrase(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (!parts.length) return name;
  const last = parts[parts.length - 1];
  let next = last;
  if (last.endsWith("ies") && last.length > 4) {
    next = `${last.slice(0, -3)}y`;
  } else if (last.endsWith("sses")) {
    next = last.slice(0, -2);
  } else if (last.endsWith("ses") && last.length > 4) {
    next = last.slice(0, -2);
  } else if (last.endsWith("s") && !last.endsWith("ss") && last.length > 3) {
    next = last.slice(0, -1);
  }
  parts[parts.length - 1] = next;
  return parts.join(" ");
}

function lookupCatalog(
  normalized: string,
  catalog: BenchmarkCatalogEntry[],
): BenchmarkCatalogEntry | null {
  const exact = catalog.find((c) => normalizeMovementName(c.name) === normalized);
  if (exact) return exact;

  const singular = singularizePhrase(normalized);
  if (singular !== normalized) {
    const hit = catalog.find((c) => normalizeMovementName(c.name) === singular);
    if (hit) return hit;
  }

  // Catalog entry is plural of the query (e.g. query "Wall Ball" vs "Wall Balls").
  const pluralHit = catalog.find((c) => singularizePhrase(normalizeMovementName(c.name)) === singular);
  if (pluralHit) return pluralHit;

  return null;
}

/**
 * Match a movement label to the benchmark catalog.
 * Conservative on purpose: false positives corrupt athlete_benchmark_summary on import.
 * Prefer unmatched (manual rematch in UI) over binding Front Rack Lunges → Front Squat.
 */
export function matchBenchmarkType(
  label: string,
  catalog: BenchmarkCatalogEntry[],
): BenchmarkCatalogEntry | null {
  const n = normalizeMovementName(label);
  if (!n) return null;

  const direct = lookupCatalog(n, catalog);
  if (direct) return direct;

  const aliasTarget = MOVEMENT_ALIASES[n] ?? MOVEMENT_ALIASES[singularizePhrase(n)];
  if (aliasTarget) {
    return lookupCatalog(normalizeMovementName(aliasTarget), catalog);
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
