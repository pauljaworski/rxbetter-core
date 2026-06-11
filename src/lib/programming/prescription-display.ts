import { percentWholeFromFraction, percentRepMaxLabel } from "@/lib/programming/percent-calculator";
import {
  formatPrescriptionAmount,
  type PrescriptionUnit,
} from "@/lib/programming/prescription-unit";
import type { ResolvedPrescription } from "@/lib/programming/rx-variants-schema";
import { formatResolvedRxParts } from "@/lib/programming/rx-variants-schema";

export type PrescriptionDisplayInput = {
  movementName: string;
  repsPrescribed?: number | null;
  prescriptionUnit?: PrescriptionUnit | string | null;
  /** e.g. "15/12 cal" when M/F amounts differ and gender unknown */
  dualAmountLabel?: string | null;
  /** e.g. "20/14 lb · 10/9 ft" when M/F modifiers differ */
  dualModifierLabel?: string | null;
  loadLabel?: string | null;
  heightLabel?: string | null;
  prescribedPercentage?: number | null;
  repMaxCount?: number | null;
  prescribedWeight?: number | null;
  /** Legacy fallback only (load/height); not for amount duplicates */
  prescribedScore?: string | null;
};

function legacyScoreIsRedundant(input: PrescriptionDisplayInput): boolean {
  const score = input.prescribedScore?.trim();
  if (!score) return true;
  if (input.dualAmountLabel?.trim() === score) return true;
  if (input.dualModifierLabel?.trim() === score) return true;
  if (input.repsPrescribed != null) {
    const amount = formatPrescriptionAmount(
      input.repsPrescribed,
      input.prescriptionUnit ?? "reps",
    );
    if (amount && (score === amount || score.startsWith(`${amount} `))) return true;
  }
  return false;
}

/** e.g. "Wall Ball - 80 Reps - 20/14 lb - 10/9 ft" or "Run - 400m" */
export function formatPrescriptionTitle(input: PrescriptionDisplayInput): string {
  const parts: string[] = [input.movementName.trim() || "Movement"];

  const rxParts = formatResolvedRxParts({
    reps_prescribed: input.repsPrescribed ?? null,
    prescription_unit: input.prescriptionUnit ?? "reps",
    prescribed_weight: input.prescribedWeight ?? null,
    prescribed_score: input.prescribedScore ?? null,
    dual_amount_label: input.dualAmountLabel ?? null,
    dual_modifier_label: input.dualModifierLabel ?? null,
    load_label: input.loadLabel ?? null,
    height_label: input.heightLabel ?? null,
  });
  parts.push(...rxParts);

  const pct = percentWholeFromFraction(input.prescribedPercentage ?? null);
  if (pct != null) {
    const basis = percentRepMaxLabel(input.repMaxCount ?? 1).replace("% ", "");
    parts.push(`${pct}% ${basis}`);
  } else if (input.prescribedWeight != null && !rxParts.length) {
    parts.push(`${input.prescribedWeight} lb`);
  } else if (!legacyScoreIsRedundant(input) && input.prescribedScore?.trim()) {
    parts.push(input.prescribedScore.trim());
  }

  return parts.join(" - ");
}

export function formatPrescriptionFromResolved(
  movementName: string,
  resolved: ResolvedPrescription,
  extras?: { prescribedPercentage?: number | null; repMaxCount?: number | null },
): string {
  return formatPrescriptionTitle({
    movementName,
    repsPrescribed: resolved.reps_prescribed,
    prescriptionUnit: resolved.prescription_unit,
    dualAmountLabel: resolved.dual_amount_label,
    dualModifierLabel: resolved.dual_modifier_label,
    loadLabel: resolved.load_label,
    heightLabel: resolved.height_label,
    prescribedScore: resolved.prescribed_score,
    prescribedWeight: resolved.prescribed_weight,
    prescribedPercentage: extras?.prescribedPercentage,
    repMaxCount: extras?.repMaxCount,
  });
}
