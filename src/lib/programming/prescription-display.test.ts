import { describe, expect, it } from "vitest";
import { formatPrescriptionTitle } from "./prescription-display";

describe("formatPrescriptionTitle", () => {
  it("formats movement, reps, and percent basis", () => {
    expect(
      formatPrescriptionTitle({
        movementName: "Snatch",
        repsPrescribed: 2,
        prescribedPercentage: 0.7,
        repMaxCount: 1,
      }),
    ).toBe("Snatch - 2 Reps - 70% 1RM");
  });
});
