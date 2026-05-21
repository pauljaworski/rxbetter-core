import { supabase } from "@/lib/supabase";

export async function fetchAthleteTrackLibraryIds(
  contactId: string,
  gymId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("athlete_subscription")
    .select("program_library_id")
    .eq("contact_id", contactId)
    .eq("gym_id", gymId)
    .eq("subscription_scope", "athlete_track")
    .not("program_library_id", "is", null);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((r) => r.program_library_id)
    .filter((id): id is string => id != null);
}

export async function loadAssignmentMap(
  programmingIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!programmingIds.length) return map;
  const { data, error } = await supabase
    .from("programming_library_assignment")
    .select("programming_id, program_library_id")
    .in("programming_id", programmingIds);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const list = map.get(row.programming_id) ?? [];
    list.push(row.program_library_id);
    map.set(row.programming_id, list);
  }
  return map;
}

export function libraryIdsForProgramming(
  prog: { id: string; program_library_id?: string | null },
  assignmentMap: Map<string, string[]>,
): string[] {
  const assigned = assignmentMap.get(prog.id) ?? [];
  if (assigned.length) return assigned;
  return prog.program_library_id ? [prog.program_library_id] : [];
}

/** When trackIds is empty, all gym programming is visible (legacy behavior). */
export function isProgrammingVisibleForTracks(
  prog: { id: string; program_library_id?: string | null },
  assignmentMap: Map<string, string[]>,
  trackIds: string[],
): boolean {
  if (!trackIds.length) return true;
  const libs = libraryIdsForProgramming(prog, assignmentMap);
  return libs.some((id) => trackIds.includes(id));
}
