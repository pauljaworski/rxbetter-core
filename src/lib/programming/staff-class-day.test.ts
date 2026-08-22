import { describe, expect, it } from "vitest";
import {
  countStaffClassScores,
  partitionStaffClassPerformances,
  staffClassScoreDisplay,
  workoutResultLineItem,
} from "@/lib/programming/staff-class-day";
import type { StaffClassPerformance, StaffClassWod } from "@/hooks/staff/types";

function perf(partial: Partial<StaffClassPerformance> & Pick<StaffClassPerformance, "id">): StaffClassPerformance {
  return {
    contact_id: "c1",
    programming_id: "prog-1",
    programming_line_item_id: null,
    score: null,
    weight_lifted: null,
    rpe: null,
    is_pr: false,
    ...partial,
  };
}

describe("partitionStaffClassPerformances", () => {
  it("keeps metcon segment scores instead of dropping them", () => {
    const { perfByItem, perfBySegment } = partitionStaffClassPerformances([
      perf({
        id: "seg-score",
        programming_id: "metcon-1",
        programming_line_item_id: null,
        score: "12+5",
      }),
      perf({
        id: "lift",
        programming_id: "strength-1",
        programming_line_item_id: "pli-1",
        weight_lifted: 185,
      }),
    ]);

    expect(perfBySegment.get("metcon-1")?.map((p) => p.id)).toEqual(["seg-score"]);
    expect(perfByItem.get("pli-1")?.map((p) => p.id)).toEqual(["lift"]);
    expect(countStaffClassScores(perfByItem, perfBySegment)).toBe(2);
  });

  it("ignores empty segment rows so blank logs do not inflate the board", () => {
    const { perfBySegment } = partitionStaffClassPerformances([
      perf({ id: "blank", programming_id: "metcon-1", score: "  " }),
      perf({ id: "null-score", programming_id: "metcon-1", score: null }),
    ]);
    expect(perfBySegment.size).toBe(0);
  });
});

describe("staffClassScoreDisplay", () => {
  it("prefers weight for lifts and score string for metcons", () => {
    expect(staffClassScoreDisplay(perf({ id: "a", weight_lifted: 225, score: "ok" }))).toBe("225 lb");
    expect(staffClassScoreDisplay(perf({ id: "b", score: "8:42" }))).toBe("8:42");
  });
});

describe("workoutResultLineItem", () => {
  it("labels the synthetic row from the WOD name", () => {
    const wod: StaffClassWod = {
      id: "w1",
      name: "Fran",
      description: null,
      programming_segment: "metcon",
      metcon_format: "for_time",
      display_order: 1,
      athlete_notes: null,
      coaches_notes: null,
    };
    expect(workoutResultLineItem(wod).bench_name).toBe("Fran");
    expect(workoutResultLineItem(wod).id).toBe("segment:w1");
  });
});
