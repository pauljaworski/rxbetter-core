import { describe, expect, it } from "vitest";
import { formatComplexMovementTitle } from "./movement-components-schema";
import {
  expandComplexSetLineItems,
  prescriptionUnitForLineItem,
} from "./complex-set-prescription";
import { formatPrescriptionAmount } from "./prescription-unit";
import { formatPrescriptionTitle } from "./prescription-display";

describe("complex set prescription", () => {
  it("formats component reps independently", () => {
    const title = formatComplexMovementTitle([
      { reps: 2, label: "Snatch Pull", benchmark_type_id: null },
      { reps: 1, label: "Power Snatch", benchmark_type_id: null },
    ]);
    expect(title).toBe("2 Snatch Pull + 1 Power Snatch");
  });

  it("uses reps unit for complex_set line items (one row per set)", () => {
    expect(
      prescriptionUnitForLineItem({ line_item_kind: "complex_set", prescription_unit: null }),
    ).toBe("reps");
    expect(
      formatPrescriptionTitle({
        movementName: "1 Snatch + 1 Hang Snatch + 2 Overhead Squat",
        repsPrescribed: null,
        prescriptionUnit: "reps",
        prescribedPercentage: 0.75,
        repMaxCount: 1,
      }),
    ).toBe("1 Snatch + 1 Hang Snatch + 2 Overhead Squat - 75% 1RM");
  });

  it("expands legacy multi-set complex rows into one line item per set", () => {
    const legacy = {
      id: "row-1",
      sequence_number: 1,
      reps_prescribed: 5,
      prescription_unit: "sets" as const,
      prescribed_weight: null,
      prescribed_percentage: 0.7,
      prescribed_score: null,
      benchmark_type_id: null,
      benchmark_definition_id: null,
      line_item_kind: "complex_set" as const,
      movement_components: [
        { reps: 1, label: "Snatch", benchmark_type_id: null },
        { reps: 1, label: "Hang Snatch", benchmark_type_id: null },
      ],
      bench_name: "1 Snatch + 1 Hang Snatch",
    };
    const expanded = expandComplexSetLineItems([legacy]);
    expect(expanded).toHaveLength(5);
    expect(expanded[0].id).toBe("row-1");
    expect(expanded[0].reps_prescribed).toBeNull();
    expect(expanded[1]._new).toBe(true);
    expect(expanded[1].id).toBeUndefined();
    expect(expanded.map((it) => it.sequence_number)).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not format set count on complex rows", () => {
    expect(formatPrescriptionAmount(5, "sets")).toBe("5 sets");
  });
});
