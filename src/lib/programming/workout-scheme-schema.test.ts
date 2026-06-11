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
});
