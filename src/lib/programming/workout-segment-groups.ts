import type { WorkoutDayProgramming } from "@/hooks/useWorkoutDay";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

/** Minimal fields required to merge multi-part programming into score blocks. */
export type SegmentGroupable = {
  id: string;
  display_order: number | null;
  segment_group_id?: string | null;
  group_score_anchor?: boolean | null;
};

export type WorkoutDayBlock<T extends SegmentGroupable = WorkoutDayProgramming> =
  | { kind: "single"; wod: T }
  | {
      kind: "group";
      groupId: string;
      anchor: T;
      parts: T[];
    };

/** Order day segments; merge rows sharing segment_group_id into one block. */
export function buildWorkoutDayBlocks<T extends SegmentGroupable>(wods: T[]): WorkoutDayBlock<T>[] {
  const sorted = [...wods].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  const blocks: WorkoutDayBlock<T>[] = [];
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
  block: WorkoutDayBlock<SegmentGroupable>,
  perfByGroup: Map<string, SegmentPerformance>,
): SegmentPerformance | null {
  if (block.kind !== "group") return null;
  return perfByGroup.get(block.groupId) ?? null;
}

/** True when a calendar/today UI must use GroupScoreRow instead of per-part MetconScoreRow. */
export function blockRequiresGroupScore(block: WorkoutDayBlock<SegmentGroupable>): boolean {
  return block.kind === "group";
}
