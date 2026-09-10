import { describe, expect, it } from "vitest";
import {
  buildWeightliftingSegmentLeaderboardPayload,
  isGroupBlockComplete,
  isPrescriptionSegmentComplete,
  resolveWeightliftingSegmentScale,
} from "./segment-completion";

describe("segment-completion", () => {
  it("metcon segment complete with segment score", () => {
    expect(isPrescriptionSegmentComplete("metcon", [], new Set(), true)).toBe(true);
    expect(isPrescriptionSegmentComplete("metcon", ["a"], new Set(), false)).toBe(false);
  });

  it("strength segment complete when all PLIs logged", () => {
    expect(
      isPrescriptionSegmentComplete(
        "weightlifting",
        ["a", "b"],
        new Set(["a", "b"]),
        false,
      ),
    ).toBe(true);
    expect(
      isPrescriptionSegmentComplete("weightlifting", ["a", "b"], new Set(["a"]), false),
    ).toBe(false);
  });

  it("group block complete with group score", () => {
    expect(isGroupBlockComplete(true)).toBe(true);
    expect(isGroupBlockComplete(false)).toBe(false);
  });

  it("uses logged scale for the weightlifting segment leaderboard row", () => {
    expect(resolveWeightliftingSegmentScale([{ workout_scale: "scaled" }])).toBe("scaled");
    expect(resolveWeightliftingSegmentScale([{ workout_scale: "fx" }])).toBe("fx");
    expect(resolveWeightliftingSegmentScale([{ workout_scale: "rx_plus" }])).toBe("rx_plus");
    expect(resolveWeightliftingSegmentScale([{ workout_scale: "rx" }])).toBe("rx");
    expect(resolveWeightliftingSegmentScale([{ workout_scale: null }])).toBe("rx");
    expect(resolveWeightliftingSegmentScale([])).toBe("rx");
  });

  it("does not pin a scaled weightlifting session to Rx", () => {
    const payload = buildWeightliftingSegmentLeaderboardPayload(
      "2026-09-10",
      ["a", "b"],
      [
        {
          programming_line_item_id: "a",
          weight_lifted: 135,
          status: "completed",
          workout_scale: "scaled",
        },
        {
          programming_line_item_id: "b",
          weight_lifted: 145,
          status: "completed",
          workout_scale: "scaled",
        },
      ],
    );
    expect(payload.workout_scale).toBe("scaled");
    expect(payload.result_value).toBe(145);
    expect(payload.score).toBe("145 lb · 2 sets");
  });
});
