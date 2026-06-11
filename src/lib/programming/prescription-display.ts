import { percentWholeFromFraction, percentRepMaxLabel } from "@/lib/programming/percent-calculator";
import {
  formatPrescriptionAmount,
  type PrescriptionUnit,
} from "@/lib/programming/prescription-unit";

export type PrescriptionDisplayInput = {
  movementName: string;
  repsPrescribed?: number | null;
  prescriptionUnit?: PrescriptionUnit | string | null;
  /** e.g. "15/12 cal" when M/F reps differ and gender unknown */
  dualAmountLabel?: string | null;
  prescribedPercentage?: number | null;
  repMaxCount?: number | null;
  prescribedWeight?: number | null;
  prescribedScore?: string | null;
};

/** e.g. "Snatch - 2 Reps - 70% 1RM" or "Run - 200m" */
export function formatPrescriptionTitle(input: PrescriptionDisplayInput): string {
  const parts: string[] = [input.movementName.trim() || "Movement"];

  if (input.dualAmountLabel?.trim()) {
    parts.push(input.dualAmountLabel.trim());
  } else if (input.repsPrescribed != null) {
    const amount = formatPrescriptionAmount(
      input.repsPrescribed,
      input.prescriptionUnit ?? "reps",
    );
    if (amount) parts.push(amount);
  }

  const pct = percentWholeFromFraction(input.prescribedPercentage ?? null);
  if (pct != null) {
    const basis = percentRepMaxLabel(input.repMaxCount ?? 1).replace("% ", "");
    parts.push(`${pct}% ${basis}`);
  } else if (input.prescribedWeight != null) {
    parts.push(`${input.prescribedWeight} lb`);
  } else if (input.prescribedScore?.trim()) {
    parts.push(input.prescribedScore.trim());
  }

  return parts.join(" - ");
}
