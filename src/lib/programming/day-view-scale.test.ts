import { describe, expect, it } from "vitest";
import {
  collectProgrammedScales,
  filterWodsByViewScale,
  filterWodsByViewScalePreservingGroups,
  resolveDayViewScale,
} from "./day-view-scale";

describe("day-view-scale", () => {
  it("collects only programmed metcon scales in order", () => {
    expect(
      collectProgrammedScales([
        { programming_segment: "metcon", prescribed_scale: "fx" },
        { programming_segment: "metcon", prescribed_scale: "rx" },
        { programming_segment: "weightlifting", prescribed_scale: "rx_plus" },
        { programming_segment: "metcon", prescribed_scale: "fx" },
      ]),
    ).toEqual(["rx", "fx"]);
  });

  it("resolves preferred view scale", () => {
    expect(resolveDayViewScale(null, "fx", ["rx", "fx"])).toBe("fx");
    expect(resolveDayViewScale("scaled", "fx", ["rx", "fx"])).toBe("fx");
    expect(resolveDayViewScale(null, null, ["rx_plus", "fx"])).toBe("rx_plus");
  });

  it("filters metcons by scale but keeps weightlifting", () => {
    const wods = [
      { id: "1", programming_segment: "metcon", prescribed_scale: "rx" },
      { id: "2", programming_segment: "metcon", prescribed_scale: "fx" },
      { id: "3", programming_segment: "weightlifting", prescribed_scale: "rx" },
    ];
    expect(filterWodsByViewScale(wods, "fx").map((w) => w.id)).toEqual(["2", "3"]);
  });

  it("keeps all linked multi-part segments when the group matches scale", () => {
    const wods = [
      {
        id: "buyin",
        programming_segment: "metcon",
        prescribed_scale: "na",
        segment_group_id: "g1",
        group_score_anchor: false,
        display_order: 0,
      },
      {
        id: "main",
        programming_segment: "metcon",
        prescribed_scale: "rx",
        segment_group_id: "g1",
        group_score_anchor: true,
        display_order: 1,
      },
      {
        id: "other",
        programming_segment: "metcon",
        prescribed_scale: "fx",
        segment_group_id: null,
        group_score_anchor: false,
        display_order: 2,
      },
    ];
    expect(filterWodsByViewScalePreservingGroups(wods, "rx").map((w) => w.id)).toEqual([
      "buyin",
      "main",
    ]);
  });
});
