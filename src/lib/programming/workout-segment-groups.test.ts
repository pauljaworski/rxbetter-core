import { describe, expect, it } from "vitest";
import { buildWorkoutDayBlocks } from "./workout-segment-groups";
import type { WorkoutDayProgramming } from "@/hooks/useWorkoutDay";

function wod(
  id: string,
  order: number,
  group?: string | null,
  anchor = false,
): WorkoutDayProgramming {
  return {
    id,
    name: id,
    description: null,
    athlete_notes: null,
    coaches_notes: null,
    programming_segment: "metcon",
    metcon_format: "for_time",
    workout_scheme: {},
    segment_group_id: group ?? null,
    group_score_anchor: anchor,
    display_order: order,
    wod_date: "2026-05-21",
    prescribed_scale: "rx",
    items: [],
  };
}

describe("buildWorkoutDayBlocks", () => {
  it("merges segments with same segment_group_id", () => {
    const blocks = buildWorkoutDayBlocks([
      wod("a", 0, "g1", true),
      wod("b", 1, "g1"),
      wod("c", 2, null),
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].kind).toBe("group");
    if (blocks[0].kind === "group") {
      expect(blocks[0].parts).toHaveLength(2);
      expect(blocks[0].anchor.id).toBe("a");
    }
    expect(blocks[1].kind).toBe("single");
  });
});
