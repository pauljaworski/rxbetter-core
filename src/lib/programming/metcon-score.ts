/** Parse mm:ss or h:mm:ss to seconds for result_value storage. */
export function parseScoreToSeconds(score: string): number | null {
  const s = score.trim();
  const parts = s.split(":").map((x) => Number(x));
  if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

export function metconScorePlaceholder(schemeKind: string | undefined): string {
  switch (schemeKind) {
    case "amrap":
      return "e.g. 12 rounds + 5";
    case "interval_series":
      return "e.g. 25:56 total";
    default:
      return "e.g. 16:48";
  }
}
