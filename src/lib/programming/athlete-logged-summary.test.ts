import { describe, expect, it } from "vitest";
import {
  formatLoggedLiftPreviews,
  formatLoggedScorePreview,
} from "./athlete-logged-summary";
import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import type { ExistingPerformance } from "@/components/rx/LogScoreSheet";

describe("formatLoggedScorePreview", () => {
  it("returns null when missing", () => {
    expect(formatLoggedScorePreview(null)).toBeNull();
    expect(formatLoggedScorePreview({ id: "1", score: null, workout_scale: null, result_value: null, score_meta: null })).toBeNull();
  });

  it("includes score and scale", () => {
    expect(
      formatLoggedScorePreview({
        id: "1",
        score: "12:34",
        workout_scale: "rx",
        result_value: 754,
        score_meta: null,
      }),
    ).toBe("12:34 · Rx");
  });
});

describe("formatLoggedLiftPreviews", () => {
  const item = (id: string, name: string): LogLineItem => ({
    id,
    sequence_number: 1,
    reps_prescribed: 5,
    prescribed_percentage: null,
    prescribed_weight: null,
    prescribed_score: null,
    status: null,
    benchmark_definition_id: null,
    benchmark_type_id: null,
    bench_name: name,
  });

  it("formats weights and fails", () => {
    const perf = new Map<string, ExistingPerformance>([
      [
        "a",
        {
          id: "p1",
          score: null,
          weight_lifted: 225,
          rpe: null,
          is_pr: true,
          status: "completed",
        },
      ],
      [
        "b",
        {
          id: "p2",
          score: null,
          weight_lifted: 185,
          rpe: null,
          is_pr: false,
          status: "failed",
        },
      ],
    ]);
    expect(formatLoggedLiftPreviews([item("a", "Back Squat"), item("b", "Clean")], perf)).toEqual([
      { name: "Back Squat", detail: "225 lb · PR" },
      { name: "Clean", detail: "185 lb (fail)" },
    ]);
  });
});
