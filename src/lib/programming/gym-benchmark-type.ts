import { supabase } from "@/lib/supabase";
import { normalizeProgrammingSegment } from "@/lib/wod-parser/intake-draft-schema";
import type { BenchmarkTypeOption } from "@/hooks/staff/types";

/** Stimulus for a newly created gym movement based on programming segment. */
export function stimulusForNewMovement(programmingSegment: string): "strength" | "skill" | "metcon" {
  const seg = normalizeProgrammingSegment(programmingSegment);
  if (seg === "weightlifting") return "strength";
  if (seg === "skill") return "skill";
  if (seg === "metcon" || seg === "bodyweight") return "skill";
  return "strength";
}

/**
 * Create or reuse a gym-scoped benchmark_type (never platform-wide).
 * Returns a catalog-shaped option for the picker / line item.
 */
export async function ensureGymBenchmarkType(
  gymId: string,
  name: string,
  programmingSegment: string,
): Promise<BenchmarkTypeOption> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Movement name is required");
  if (!gymId) throw new Error("Active gym is required to save a custom movement");

  const stimulus = stimulusForNewMovement(programmingSegment);
  const { data, error } = await supabase.rpc("ensure_gym_benchmark_type", {
    p_gym_id: gymId,
    p_name: trimmed,
    p_stimulus: stimulus,
    p_sub_stimulus: null,
    p_purpose_variation: "gym_custom",
  });
  if (error) throw new Error(error.message);
  const id = data as string;
  if (!id) throw new Error("Failed to create gym movement");

  return {
    id,
    name: trimmed,
    stimulus,
    purpose_variation: "gym_custom",
  };
}

/** Format rest seconds as m:ss or :ss for prescriptions. */
export function formatRestDuration(sec: number | null | undefined): string | null {
  if (sec == null || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}`;
  return `:${String(s).padStart(2, "0")}`;
}

/** Parse "1:30", "90", ":45" into seconds. */
export function parseRestDuration(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return Math.min(7200, Math.max(0, Number(t)));
  const mmss = t.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (mmss) {
    const m = Number(mmss[1]);
    const s = Number(mmss[2]);
    if (s >= 60) return null;
    return Math.min(7200, m * 60 + s);
  }
  const colonOnly = t.match(/^:\s*(\d{1,2})$/);
  if (colonOnly) return Math.min(7200, Number(colonOnly[1]));
  return null;
}
