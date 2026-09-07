import { describe, expect, it } from "vitest";
import {
  collectProgrammedScales,
  filterWodsByViewScale,
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
});
