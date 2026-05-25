import type { WorkoutDayProgramming } from "@/hooks/useWorkoutDay";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

export type WorkoutDayBlock =
  | { kind: "single"; wod: WorkoutDayProgramming }
  | {
      kind: "group";
      groupId: string;
      anchor: WorkoutDayProgramming;
      parts: WorkoutDayProgramming[];
    };

/** Order day segments; merge rows sharing segment_group_id into one block. */
export function buildWorkoutDayBlocks(wods: WorkoutDayProgramming[]): WorkoutDayBlock[] {
  const sorted = [...wods].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  const blocks: WorkoutDayBlock[] = [];
  const seenGroups = new Set<string>();

  for (const wod of sorted) {
    const gid = wod.segment_group_id;
    if (!gid) {
      blocks.push({ kind: "single", wod });
      continue;
    }
    if (seenGroups.has(gid)) continue;
    seenGroups.add(gid);
    const parts = sorted.filter((w) => w.segment_group_id === gid);
    const anchor = parts.find((p) => p.group_score_anchor) ?? parts[0];
    blocks.push({ kind: "group", groupId: gid, anchor, parts });
  }

  return blocks;
}

export function groupScoreForBlock(
  block: WorkoutDayBlock,
  perfByGroup: Map<string, SegmentPerformance>,
): SegmentPerformance | null {
  if (block.kind !== "group") return null;
  return perfByGroup.get(block.groupId) ?? null;
}
