import { describe, expect, it } from "vitest";
import { resolveEditorWorkoutScheme } from "./workout-scheme-schema";

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

  it("falls back from metcon_format when workout_scheme is an empty object", () => {
    const scheme = resolveEditorWorkoutScheme({
      workout_scheme: {},
      metcon_format: "amrap",
    });
    expect(scheme?.kind).toBe("amrap");
    expect(scheme?.scoreMetric).toBe("rounds_reps");
  });

  it("falls back EMOM from metcon_format so scores are not treated as time", () => {
    const scheme = resolveEditorWorkoutScheme({
      workout_scheme: {},
      metcon_format: "emom",
    });
    expect(scheme?.kind).toBe("emom");
    expect(scheme?.scoreMetric).toBe("rounds_reps");
  });

  it("does not invent a scheme when both workout_scheme and metcon_format are empty", () => {
    expect(resolveEditorWorkoutScheme({ workout_scheme: {}, metcon_format: null })).toBeNull();
  });
});
