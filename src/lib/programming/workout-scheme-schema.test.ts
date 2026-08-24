import { describe, expect, it } from "vitest";
import { effectiveScoreMetric } from "./metcon-score";
import { parseWorkoutScheme, resolveEditorWorkoutScheme } from "./workout-scheme-schema";

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

describe("parseWorkoutScheme scoreMetric overrides", () => {
  it("keeps AMRAP time cap when Score by is Total reps", () => {
    const scheme = parseWorkoutScheme({
      kind: "amrap",
      timeCapMin: 20,
      scoreMetric: "reps",
    });
    expect(scheme).not.toBeNull();
    expect(scheme?.kind).toBe("amrap");
    if (scheme?.kind === "amrap") {
      expect(scheme.timeCapMin).toBe(20);
      expect(scheme.scoreMetric).toBe("reps");
    }
    expect(effectiveScoreMetric(scheme?.scoreMetric, scheme?.kind)).toBe("reps");
  });

  it("does not fall back to default 12-min AMRAP after a non-default Score by", () => {
    const parsed = parseWorkoutScheme({
      kind: "amrap",
      timeCapMin: 20,
      scoreMetric: "reps",
    });
    const editor = resolveEditorWorkoutScheme({
      workout_scheme: parsed,
      metcon_format: "amrap",
    });
    expect(editor?.kind).toBe("amrap");
    if (editor?.kind === "amrap") {
      expect(editor.timeCapMin).toBe(20);
      expect(editor.scoreMetric).toBe("reps");
    }
  });

  it("keeps for-time completion scoring instead of dropping the scheme", () => {
    const scheme = parseWorkoutScheme({
      kind: "for_time",
      scoreMetric: "completion",
      workoutIntent: "for_completion",
    });
    expect(scheme?.kind).toBe("for_time");
    expect(scheme?.scoreMetric).toBe("completion");
    expect(effectiveScoreMetric(scheme?.scoreMetric, scheme?.kind)).toBe("completion");
  });
});
