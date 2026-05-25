import { describe, expect, it } from "vitest";
import {
  defaultSchemeForKind,
  parseWorkoutScheme,
  schemeSummaryLabel,
} from "./workout-scheme-schema";

describe("workout-scheme-schema", () => {
  it("parses rft scheme", () => {
    const s = parseWorkoutScheme({ kind: "rft", rounds: 3, scoreMetric: "time" });
    expect(s?.kind).toBe("rft");
    expect(schemeSummaryLabel(s)).toBe("3 RFT");
  });

  it("parses rep ladder scheme", () => {
    const s = parseWorkoutScheme({
      kind: "rep_ladder",
      repSequence: [21, 18, 15, 12, 9],
      scoreMetric: "time",
      betweenRounds: { amount: 200, prescriptionUnit: "meters", label: "Run" },
    });
    expect(s?.kind).toBe("rep_ladder");
    expect(schemeSummaryLabel(s)).toContain("21-18-15-12-9");
    expect(schemeSummaryLabel(s)).toContain("200");
  });

  it("defaults emom completion to completion score", () => {
    const s = defaultSchemeForKind("emom_completion");
    expect(s.scoreMetric).toBe("completion");
  });
});
