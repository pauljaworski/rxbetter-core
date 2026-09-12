import { describe, expect, it } from "vitest";
import { formatPrescriptionTitle } from "./prescription-display";
import {
  formatDualAmountLabel,
  formatDualModifierLabel,
  formatDualModifierParens,
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

  it("formats dual load and height modifiers for legacy storage", () => {
    expect(
      formatDualModifierLabel({
        male: { load_label: "20 lb", height_label: "10 ft" },
        female: { load_label: "14 lb", height_label: "9 ft" },
      }),
    ).toBe("20/14 lb · 10/9 ft");
  });

  it("formats athlete dual modifiers as (115/75) and (10'/9')", () => {
    expect(
      formatDualModifierParens({
        male: { load_label: "20 lb", height_label: "10 ft" },
        female: { load_label: "14 lb", height_label: "9 ft" },
      }),
    ).toEqual(["(20/14)", "(10'/9')"]);
    expect(
      formatDualModifierParens({
        male: { load_label: "115 lb" },
        female: { load_label: "75 lb" },
      }),
    ).toEqual(["(115/75)"]);
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

  it("always shows dual load and height including wall-ball target", () => {
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
    expect(resolved.dual_modifier_label).toBe("(20/14) · (10'/9')");
    expect(formatResolvedRxParts(resolved)).toEqual(["80 Reps", "(20/14)", "(10'/9')"]);
    expect(
      formatPrescriptionTitle({
        movementName: "Wall Balls",
        repsPrescribed: resolved.reps_prescribed,
        prescriptionUnit: resolved.prescription_unit,
        dualModifierLabel: resolved.dual_modifier_label,
      }),
    ).toBe("Wall Balls - 80 Reps (20/14) (10'/9')");
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

  it("shows dual load even when Female Rx is selected", () => {
    const resolved = resolvePrescriptionForAthlete(
      {
        reps_prescribed: 20,
        prescription_unit: "reps",
        rx_variants: {
          male: { reps: 20, load_label: "50 lb" },
          female: { reps: 20, load_label: "35 lb" },
        },
      },
      "female",
    );
    expect(formatResolvedRxParts(resolved)).toEqual(["20 Reps", "(50/35)"]);
    expect(resolved.dual_modifier_label).toBe("(50/35)");
  });

  it("shows dual load even when Male Rx is selected", () => {
    const resolved = resolvePrescriptionForAthlete(
      {
        rx_variants: {
          male: { reps: 20, load_label: "50 lb" },
          female: { reps: 20, load_label: "35 lb" },
        },
      },
      "male",
    );
    expect(formatResolvedRxParts(resolved)).toEqual(["20 Reps", "(50/35)"]);
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
