import { describe, expect, it } from "vitest";
import { supportsDbKbLoadModality } from "./manual-config";

describe("supportsDbKbLoadModality", () => {
  it("allows strength stimulus and weightlifting segments", () => {
    expect(supportsDbKbLoadModality({ stimulus: "strength" })).toBe(true);
    expect(supportsDbKbLoadModality({ programmingSegment: "weightlifting" })).toBe(true);
  });

  it("allows dumbbell / kettlebell purpose variations", () => {
    expect(supportsDbKbLoadModality({ purpose_variation: "dumbbell" })).toBe(true);
    expect(supportsDbKbLoadModality({ purpose_variation: "kettlebell" })).toBe(true);
  });

  it("rejects skill / monostructural movements", () => {
    expect(supportsDbKbLoadModality({ stimulus: "skill" })).toBe(false);
    expect(
      supportsDbKbLoadModality({ stimulus: "skill", purpose_variation: "aerobic" }),
    ).toBe(false);
    expect(supportsDbKbLoadModality({ stimulus: null })).toBe(false);
  });
});
