export function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00Z");
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function fmtWeight(w?: number | null): string {
  if (w == null) return "—";
  return `${Math.round(Number(w))}`;
}

export function segmentLabel(seg?: string | null, subtype?: string | null): string {
  if (subtype === "strength") return "Strength";
  if (subtype === "weightlifting") return "Weightlifting";
  if (subtype === "hiit") return "HIIT";
  if (!seg) return "Block";
  return seg.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export const WORKOUT_SCALE_OPTIONS = [
  { value: "rx_plus", label: "Rx+" },
  { value: "rx", label: "Rx" },
  { value: "fx", label: "Fx" },
  { value: "scaled", label: "Scaled" },
] as const;

export type WorkoutScale = (typeof WORKOUT_SCALE_OPTIONS)[number]["value"];

/** Prescribed segment level (programming.prescribed_scale). */
export const PRESCRIBED_LEVEL_OPTIONS = [
  ...WORKOUT_SCALE_OPTIONS,
  { value: "na", label: "N/A" },
] as const;

export type PrescribedLevel = (typeof PRESCRIBED_LEVEL_OPTIONS)[number]["value"];

export function prescribedLevelLabel(scale: string | null | undefined): string | null {
  if (!scale) return null;
  const hit = PRESCRIBED_LEVEL_OPTIONS.find((o) => o.value === scale);
  return hit?.label ?? null;
}

export function seededHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededSample<T>(items: T[], count: number, seed: string): T[] {
  if (items.length === 0 || count <= 0) return [];
  const indexed = items.map((item, i) => ({
    item,
    score: seededHash(`${seed}:${i}`),
  }));
  indexed.sort((a, b) => a.score - b.score);
  return indexed.slice(0, Math.min(count, items.length)).map((x) => x.item);
}

export function formatSupabaseError(message: string): string {
  if (message.includes("permission") || message.includes("42501") || message.includes("RLS")) {
    return "You don't have access to this track at this gym. Check your membership or ask your coach.";
  }
  return message;
}
