import { describe, expect, it } from "vitest";
import {
  formatRxVariantsCompact,
  resolvePrescriptionForAthlete,
  syncLegacyFieldsFromVariants,
} from "./rx-variants-schema";

describe("rx-variants-schema", () => {
  it("formats dual rep schemes", () => {
    expect(
      formatRxVariantsCompact(
        {
          male: { reps: 15, prescription_unit: "calories" },
          female: { reps: 12, prescription_unit: "calories" },
        },
        "calories",
      ),
    ).toBe("15/12 cal");
  });

  it("formats dual weight loads", () => {
    expect(
      formatRxVariantsCompact({
        male: { weight_lb: 135 },
        female: { weight_lb: 95 },
      }),
    ).toBe("135/95 lb");
  });

  it("resolves athlete-specific prescription", () => {
    const resolved = resolvePrescriptionForAthlete(
      {
        rx_variants: {
          male: { reps: 15, prescription_unit: "calories" },
          female: { reps: 12, prescription_unit: "calories" },
        },
      },
      "female",
    );
    expect(resolved.reps_prescribed).toBe(12);
    expect(resolved.prescription_unit).toBe("calories");
  });

  it("shows dual notation when gender unknown", () => {
    const resolved = resolvePrescriptionForAthlete(
      {
        rx_variants: {
          male: { reps: 15, prescription_unit: "calories" },
          female: { reps: 12, prescription_unit: "calories" },
        },
      },
      null,
    );
    expect(resolved.dual_amount_label).toBe("15/12 cal");
    expect(resolved.reps_prescribed).toBeNull();
  });

  it("syncs legacy columns from variants", () => {
    const synced = syncLegacyFieldsFromVariants({
      rx_variants: {
        male: { reps: 15, prescription_unit: "calories" },
        female: { reps: 12, prescription_unit: "calories" },
      },
    });
    expect(synced.reps_prescribed).toBe(15);
    expect(synced.prescribed_score).toBe("15/12 cal");
  });
});
