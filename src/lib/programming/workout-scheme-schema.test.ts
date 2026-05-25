import { describe, expect, it } from "vitest";
import { parseWorkoutScheme, schemeSummaryLabel } from "./workout-scheme-schema";

describe("workout-scheme-schema", () => {
  it("parses rft scheme", () => {
    const s = parseWorkoutScheme({ kind: "rft", rounds: 3, scoreMetric: "time" });
    expect(s?.kind).toBe("rft");
    expect(schemeSummaryLabel(s)).toBe("3 RFT");
  });
});
