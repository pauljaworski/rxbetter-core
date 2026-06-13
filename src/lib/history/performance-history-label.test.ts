import { describe, expect, it } from "vitest";
import { performanceHistoryLabels } from "./performance-history-label";

describe("performanceHistoryLabels", () => {
  it("shows lift name and RM for imported strength", () => {
    const { title, subtitle } = performanceHistoryLabels({
      programming_id: null,
      bench_name: "Back Squat",
      weight_lifted: 315,
      score: null,
      rep_count: 1,
      stimulus: "Weightlifting",
      score_meta: { source: "import", label: "Back Squat", kind: "lift" },
    });
    expect(title).toBe("Back Squat");
    expect(subtitle).toContain("1 RM");
    expect(subtitle).toContain("Imported");
  });

  it("uses import label for unmatched workout scores", () => {
    const { title, subtitle } = performanceHistoryLabels({
      programming_id: null,
      weight_lifted: null,
      score: "4:32",
      score_meta: { source: "import", label: "Fran", kind: "workout" },
      workout_scale: "rx",
    });
    expect(title).toBe("Fran");
    expect(subtitle).toContain("Imported workout");
    expect(subtitle).toContain("Rx");
  });

  it("shows class WOD name when linked to programming", () => {
    const { title, subtitle } = performanceHistoryLabels({
      programming_id: "prog-1",
      wod_name: "Tuesday Metcon",
      weight_lifted: null,
      score: "12:01",
      workout_scale: "scaled",
    });
    expect(title).toBe("Tuesday Metcon");
    expect(subtitle).toContain("Scaled");
  });

  it("shows RM and stimulus for standalone lifts without import meta", () => {
    const { title, subtitle } = performanceHistoryLabels({
      programming_id: null,
      bench_name: "Deadlift",
      weight_lifted: 405,
      score: null,
      rep_count: 1,
      stimulus: "Weightlifting",
      score_meta: null,
    });
    expect(title).toBe("Deadlift");
    expect(subtitle).toBe("1 RM · Weightlifting · Personal log");
  });
});
