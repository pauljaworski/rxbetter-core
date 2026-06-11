import { describe, expect, it } from "vitest";
import { formatPrescriptionTitle } from "./prescription-display";
import {
  formatDualAmountLabel,
  formatDualModifierLabel,
  formatRxVariantsCompact,
  formatResolvedRxParts,
  resolvePrescriptionForAthlete,
  syncLegacyFieldsFromVariants,
} from "./rx-variants-schema";

describe("rx-variants-schema", () => {
  it("formats dual rep schemes", () => {
    expect(
      formatDualAmountLabel(
        {
          male: { reps: 15, prescription_unit: "calories" },
          female: { reps: 12, prescription_unit: "calories" },
        },
        "calories",
      ),
    ).toBe("15/12 cal");
  });

  it("formats dual load and height modifiers", () => {
    expect(
      formatDualModifierLabel({
        male: { load_label: "20 lb", height_label: "10 ft" },
        female: { load_label: "14 lb", height_label: "9 ft" },
      }),
    ).toBe("20/14 lb · 10/9 ft");
  });

  it("does not duplicate meters in athlete display", () => {
    const resolved = resolvePrescriptionForAthlete(
      {
        reps_prescribed: 400,
        prescription_unit: "meters",
        prescribed_score: "400m",
        rx_variants: {
          male: { reps: 400, prescription_unit: "meters" },
          female: { reps: 400, prescription_unit: "meters" },
        },
      },
      null,
    );
    const title = formatPrescriptionTitle({
      movementName: "Run",
      repsPrescribed: resolved.reps_prescribed,
      prescriptionUnit: resolved.prescription_unit,
      dualAmountLabel: resolved.dual_amount_label,
      dualModifierLabel: resolved.dual_modifier_label,
      loadLabel: resolved.load_label,
      heightLabel: resolved.height_label,
      prescribedScore: resolved.prescribed_score,
    });
    expect(title).toBe("Run - 400m");
    expect(title).not.toContain("400m - 400m");
  });

  it("resolves athlete-specific prescription with load and height", () => {
    const resolved = resolvePrescriptionForAthlete(
      {
        rx_variants: {
          male: { reps: 80, prescription_unit: "reps", load_label: "20 lb", height_label: "10 ft" },
          female: { reps: 80, prescription_unit: "reps", load_label: "14 lb", height_label: "9 ft" },
        },
      },
      "female",
    );
    expect(resolved.reps_prescribed).toBe(80);
    expect(resolved.load_label).toBe("14 lb");
    expect(resolved.height_label).toBe("9 ft");
    expect(formatResolvedRxParts(resolved)).toEqual(["80 Reps", "14 lb", "9 ft"]);
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

  it("syncs legacy columns without amount in prescribed_score", () => {
    const synced = syncLegacyFieldsFromVariants({
      rx_variants: {
        male: { reps: 15, prescription_unit: "calories" },
        female: { reps: 12, prescription_unit: "calories" },
      },
    });
    expect(synced.reps_prescribed).toBe(15);
    expect(synced.prescribed_score).toBeNull();
  });

  it("syncs modifiers to prescribed_score", () => {
    const synced = syncLegacyFieldsFromVariants({
      rx_variants: {
        male: { reps: 80, load_label: "20 lb", height_label: "10 ft" },
        female: { reps: 80, load_label: "14 lb", height_label: "9 ft" },
      },
    });
    expect(synced.prescribed_score).toBe("20/14 lb · 10/9 ft");
  });

  it("formatRxVariantsCompact combines amount and modifiers", () => {
    expect(
      formatRxVariantsCompact({
        male: { reps: 80, load_label: "20 lb" },
        female: { reps: 80, load_label: "14 lb" },
      }),
    ).toBe("80 Reps · 20/14 lb");
  });
});
