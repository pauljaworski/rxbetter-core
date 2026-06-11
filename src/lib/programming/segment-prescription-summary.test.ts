import { describe, expect, it } from "vitest";
import { summarizeLineItemBrief, summarizeSegmentPrescription } from "./segment-prescription-summary";

describe("segment-prescription-summary", () => {
  it("summarizes complex set with sets and percent", () => {
    const line = summarizeLineItemBrief({
      id: "1",
      sequence_number: 1,
      reps_prescribed: 5,
      prescribed_percentage: 0.7,
      prescribed_weight: null,
      prescribed_score: null,
      status: null,
      benchmark_definition_id: null,
      benchmark_type_id: null,
      line_item_kind: "complex_set",
      movement_components: [
        { reps: 2, label: "Clean Pull", benchmark_type_id: null },
        { reps: 1, label: "Power Clean", benchmark_type_id: null },
      ],
    });
    expect(line).toContain("5 sets");
    expect(line).toContain("Clean Pull");
    expect(line).toContain("70%");
  });

  it("summarizes gender-specific reps", () => {
    const line = summarizeLineItemBrief({
      id: "2",
      sequence_number: 1,
      reps_prescribed: 15,
      prescription_unit: "calories",
      prescribed_percentage: null,
      prescribed_weight: null,
      prescribed_score: "15/12 cal",
      status: null,
      benchmark_definition_id: null,
      benchmark_type_id: null,
      bench_name: "Ski Erg",
      rx_variants: {
        male: { reps: 15, prescription_unit: "calories" },
        female: { reps: 12, prescription_unit: "calories" },
      },
    });
    expect(line).toContain("15/12 cal");
    expect(line).toContain("Ski Erg");
  });

  it("summarizes metcon with scheme footer", () => {
    const { lines, footer } = summarizeSegmentPrescription(
      {
        programming_segment: "metcon",
        metcon_format: "for_time",
        workout_scheme: { kind: "rft", rounds: 3, scoreMetric: "time" },
      },
      [
        {
          id: "a",
          sequence_number: 1,
          reps_prescribed: 20,
          prescription_unit: "reps",
          prescribed_percentage: null,
          prescribed_weight: null,
          prescribed_score: null,
          status: null,
          benchmark_definition_id: null,
          benchmark_type_id: null,
          bench_name: "Wall Ball",
        },
      ],
    );
    expect(lines[0]).toContain("Wall Ball");
    expect(footer).toBe("3 RFT");
  });
});
