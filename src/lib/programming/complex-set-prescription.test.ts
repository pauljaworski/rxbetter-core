import { describe, expect, it } from "vitest";
import { formatComplexMovementTitle } from "./movement-components-schema";
import { prescriptionUnitForLineItem } from "./complex-set-prescription";
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

  it("uses sets unit for complex_set line items", () => {
    expect(
      prescriptionUnitForLineItem({ line_item_kind: "complex_set", prescription_unit: "reps" }),
    ).toBe("sets");
    expect(formatPrescriptionAmount(5, "sets")).toBe("5 sets");
    expect(
      formatPrescriptionTitle({
        movementName: "2 Snatch Pull + 1 Power Snatch",
        repsPrescribed: 5,
        prescriptionUnit: "sets",
        prescribedPercentage: 0.75,
        repMaxCount: 1,
      }),
    ).toBe("2 Snatch Pull + 1 Power Snatch - 5 sets - 75% 1RM");
  });
});
