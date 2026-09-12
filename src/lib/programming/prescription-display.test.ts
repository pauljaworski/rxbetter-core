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

  it("formats sets for complexes", () => {
    expect(
      formatPrescriptionTitle({
        movementName: "2 Snatch Pull + 1 Power Snatch",
        repsPrescribed: 5,
        prescriptionUnit: "sets",
      }),
    ).toBe("2 Snatch Pull + 1 Power Snatch - 5 sets");
  });

  it("formats dual load and height in parentheses", () => {
    expect(
      formatPrescriptionTitle({
        movementName: "Wall Balls",
        repsPrescribed: 40,
        prescriptionUnit: "reps",
        dualModifierLabel: "(20/14) · (10'/9')",
      }),
    ).toBe("Wall Balls - 40 Reps (20/14) (10'/9')");
  });

  it("formats legacy dual modifiers into paren slash form", () => {
    expect(
      formatPrescriptionTitle({
        movementName: "Wall Balls",
        repsPrescribed: 40,
        prescriptionUnit: "reps",
        dualModifierLabel: "20/14 lb · 10/9 ft",
      }),
    ).toBe("Wall Balls - 40 Reps (20/14) (10'/9')");
  });

  it("formats single load pair in parentheses", () => {
    expect(
      formatPrescriptionTitle({
        movementName: "Hang Power Clean",
        repsPrescribed: 10,
        prescriptionUnit: "reps",
        dualModifierLabel: "(115/75)",
      }),
    ).toBe("Hang Power Clean - 10 Reps (115/75)");
  });
});
