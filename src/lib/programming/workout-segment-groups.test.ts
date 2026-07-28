import { describe, expect, it } from "vitest";
import {
  blockRequiresGroupScore,
  buildWorkoutDayBlocks,
  groupScoreForBlock,
} from "./workout-segment-groups";
import type { WorkoutDayProgramming } from "@/hooks/useWorkoutDay";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

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
    programming_subtype: null,
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

  it("flags multi-part calendar blocks so per-part segment scores stay hidden", () => {
    // Calendar used to render each part independently and call useSaveSegmentPerformance
    // (programming_id set, segment_group_id null). Grouped boards + Today expect one
    // segment_group_id score row instead.
    const weekLike = [
      {
        id: "part-a",
        display_order: 0,
        segment_group_id: "g-block",
        group_score_anchor: true,
        wod_date: "2026-07-28",
      },
      {
        id: "part-b",
        display_order: 1,
        segment_group_id: "g-block",
        group_score_anchor: false,
        wod_date: "2026-07-28",
      },
    ];
    const blocks = buildWorkoutDayBlocks(weekLike);
    expect(blocks).toHaveLength(1);
    expect(blockRequiresGroupScore(blocks[0])).toBe(true);
    if (blocks[0].kind === "group") {
      expect(blocks[0].groupId).toBe("g-block");
      expect(blocks[0].parts.map((p) => p.id)).toEqual(["part-a", "part-b"]);
    }

    const perfByGroup = new Map<string, SegmentPerformance>([
      [
        "g-block",
        {
          id: "perf-1",
          score: "12:34",
          workout_scale: "rx",
          result_value: 754,
          score_meta: {},
        },
      ],
    ]);
    expect(groupScoreForBlock(blocks[0], perfByGroup)?.id).toBe("perf-1");
  });
});
