import type { WorkoutDayProgramming } from "@/hooks/useWorkoutDay";
import { libraryIdsForProgramming } from "@/lib/programming/athlete-library-filter";

export type DayTrackOption = {
  id: string;
  name: string;
};

/** Tracks that have at least one segment on the day (by assignment or legacy column). */
export function collectDayTracks(
  wods: Array<{
    id: string;
    program_library_id?: string | null;
    program_library_ids?: string[];
    source?: string;
  }>,
  libraries: Array<{ id: string; name: string }>,
  assignmentMap?: Map<string, string[]>,
): DayTrackOption[] {
  const nameById = new Map(libraries.map((l) => [l.id, l.name]));
  const present = new Set<string>();

  for (const w of wods) {
    if (w.source === "athlete_custom") continue;
    const fromWod =
      w.program_library_ids?.length
        ? w.program_library_ids
        : assignmentMap
          ? libraryIdsForProgramming(w, assignmentMap)
          : w.program_library_id
            ? [w.program_library_id]
            : [];
    for (const id of fromWod) present.add(id);
  }

  return [...present]
    .map((id) => ({ id, name: nameById.get(id) ?? "Track" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterWodsByTrack<
  T extends {
    id: string;
    program_library_id?: string | null;
    program_library_ids?: string[];
    source?: string;
  },
>(wods: T[], trackId: string | "all", assignmentMap?: Map<string, string[]>): T[] {
  if (trackId === "all") return wods;
  return wods.filter((w) => {
    if (w.source === "athlete_custom") return true;
    const libs =
      w.program_library_ids?.length
        ? w.program_library_ids
        : assignmentMap
          ? libraryIdsForProgramming(w, assignmentMap)
          : w.program_library_id
            ? [w.program_library_id]
            : [];
    if (!libs.length) return true;
    return libs.includes(trackId);
  });
}

export function enrichWodsWithLibraryIds(
  wods: WorkoutDayProgramming[],
  assignmentMap: Map<string, string[]>,
): Array<WorkoutDayProgramming & { program_library_ids: string[] }> {
  return wods.map((w) => ({
    ...w,
    program_library_ids: libraryIdsForProgramming(w, assignmentMap),
  }));
}
