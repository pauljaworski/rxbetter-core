import { describe, expect, it } from "vitest";
import { buildWorkoutDayBlocks } from "./workout-segment-groups";
import type { WorkoutDayProgramming } from "@/hooks/useWorkoutDay";

function wod(overrides: Partial<WorkoutDayProgramming>): WorkoutDayProgramming {
  return {
    id: "x",
    name: "W",
    description: null,
    athlete_notes: null,
    coaches_notes: null,
    programming_segment: "metcon",
    metcon_format: "for_time",
    workout_scheme: { kind: "for_time", scoreMetric: "time" },
    segment_group_id: null,
    group_score_anchor: false,
    programming_subtype: null,
    display_order: 0,
    wod_date: "2026-09-05",
    prescribed_scale: "rx",
    items: [],
    ...overrides,
  };
}

describe("buildWorkoutDayBlocks", () => {
  it("merges parts that share segment_group_id", () => {
    const blocks = buildWorkoutDayBlocks([
      wod({ id: "1", name: "Buy-in", segment_group_id: "g1", display_order: 0 }),
      wod({
        id: "2",
        name: "Main",
        segment_group_id: "g1",
        group_score_anchor: true,
        display_order: 1,
      }),
      wod({ id: "3", name: "Solo", display_order: 2 }),
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].kind).toBe("group");
    if (blocks[0].kind === "group") {
      expect(blocks[0].parts).toHaveLength(2);
      expect(blocks[0].anchor.id).toBe("2");
    }
    expect(blocks[1].kind).toBe("single");
  });
});
