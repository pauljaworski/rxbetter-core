import { describe, expect, it } from "vitest";
import {
  parseWorkoutScheme,
  resolveEditorWorkoutScheme,
  schemeSummaryLabel,
} from "./workout-scheme-schema";

describe("resolveEditorWorkoutScheme", () => {
  it("defaults AMRAP time cap from metcon_format before save", () => {
    const scheme = resolveEditorWorkoutScheme({
      workout_scheme: null,
      metcon_format: "amrap",
    });
    expect(scheme?.kind).toBe("amrap");
    if (scheme?.kind === "amrap") {
      expect(scheme.timeCapMin).toBe(12);
    }
  });

  it("prefers saved workout_scheme", () => {
    const scheme = resolveEditorWorkoutScheme({
      workout_scheme: { kind: "amrap", timeCapMin: 18, scoreMetric: "rounds_reps" },
      metcon_format: "amrap",
    });
    expect(scheme?.kind).toBe("amrap");
    if (scheme?.kind === "amrap") {
      expect(scheme.timeCapMin).toBe(18);
    }
  });
});

describe("parseWorkoutScheme scoreMetric", () => {
  it("accepts non-time scoreMetric on for_time", () => {
    const scheme = parseWorkoutScheme({
      kind: "for_time",
      scoreMetric: "completion",
      workoutIntent: "for_completion",
    });
    expect(scheme?.kind).toBe("for_time");
    expect(scheme?.scoreMetric).toBe("completion");
  });

  it("accepts rounds_reps on rft and rep_ladder", () => {
    expect(
      parseWorkoutScheme({ kind: "rft", rounds: 5, scoreMetric: "rounds_reps" })?.scoreMetric,
    ).toBe("rounds_reps");
    expect(
      parseWorkoutScheme({
        kind: "rep_ladder",
        repSequence: [21, 15, 9],
        scoreMetric: "reps",
        betweenRounds: { label: "Run", amount: 200, prescriptionUnit: "meters" },
      })?.scoreMetric,
    ).toBe("reps");
  });

  it("summarizes between-rounds with unit", () => {
    const label = schemeSummaryLabel({
      kind: "rep_ladder",
      repSequence: [21, 15, 9],
      scoreMetric: "time",
      betweenRounds: { label: "Run", amount: 200, prescriptionUnit: "meters" },
    });
    expect(label).toMatch(/21-15-9/);
    expect(label).toMatch(/200m/);
    expect(label).toMatch(/Run/);
  });

  it("accepts and summarizes optional time caps on for-time formats", () => {
    const rft = parseWorkoutScheme({
      kind: "rft",
      rounds: 5,
      timeCapMin: 20,
      scoreMetric: "time",
    });
    expect(rft?.kind).toBe("rft");
    if (rft?.kind === "rft") expect(rft.timeCapMin).toBe(20);
    expect(schemeSummaryLabel(rft)).toMatch(/20 min cap/);

    const forTime = parseWorkoutScheme({
      kind: "for_time",
      timeCapMin: 12,
      scoreMetric: "time",
    });
    expect(schemeSummaryLabel(forTime)).toBe("For time · 12 min cap");

    const chipper = parseWorkoutScheme({
      kind: "chipper",
      timeCapMin: 15,
      scoreMetric: "time",
    });
    expect(schemeSummaryLabel(chipper)).toMatch(/15 min cap/);
  });
});
