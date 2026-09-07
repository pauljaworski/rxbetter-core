import type { WorkoutScale } from "@/lib/format";
import { WORKOUT_SCALE_OPTIONS } from "@/lib/format";
import { isMetconSegment } from "@/lib/programming/manual-config";

const SCALE_ORDER = WORKOUT_SCALE_OPTIONS.map((o) => o.value);

export function isWorkoutScale(v: string | null | undefined): v is WorkoutScale {
  return v === "rx_plus" || v === "rx" || v === "fx" || v === "scaled";
}

/** Unique prescribed scales for metcon segments programmed that day, in display order. */
export function collectProgrammedScales(
  wods: Array<{ programming_segment?: string | null; prescribed_scale?: string | null }>,
): WorkoutScale[] {
  const present = new Set<WorkoutScale>();
  for (const w of wods) {
    if (!isMetconSegment(w.programming_segment ?? "")) continue;
    const raw = w.prescribed_scale ?? "rx";
    if (isWorkoutScale(raw)) present.add(raw);
  }
  return SCALE_ORDER.filter((s) => present.has(s));
}

/** Prefer profile default if programmed today; else Rx; else first available. */
export function resolveDayViewScale(
  selected: WorkoutScale | null,
  profileDefault: WorkoutScale | null,
  available: WorkoutScale[],
): WorkoutScale | null {
  if (!available.length) return null;
  if (selected && available.includes(selected)) return selected;
  if (profileDefault && available.includes(profileDefault)) return profileDefault;
  if (available.includes("rx")) return "rx";
  return available[0] ?? null;
}

/**
 * Metcons must match the selected scale; other segments always show.
 * When no scale filter, show everything.
 */
export function filterWodsByViewScale<
  T extends { programming_segment?: string | null; prescribed_scale?: string | null },
>(wods: T[], viewScale: WorkoutScale | null): T[] {
  if (!viewScale) return wods;
  return wods.filter((w) => {
    if (!isMetconSegment(w.programming_segment ?? "")) return true;
    const s = w.prescribed_scale ?? "rx";
    if (s === "na") return true;
    return s === viewScale;
  });
}
