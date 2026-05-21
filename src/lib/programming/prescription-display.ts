import { percentWholeFromFraction, percentRepMaxLabel } from "@/lib/programming/percent-calculator";

export type PrescriptionDisplayInput = {
  movementName: string;
  repsPrescribed?: number | null;
  prescribedPercentage?: number | null;
  repMaxCount?: number | null;
  prescribedWeight?: number | null;
  prescribedScore?: string | null;
};

/** e.g. "Snatch - 2 Reps - 70% 1RM" */
export function formatPrescriptionTitle(input: PrescriptionDisplayInput): string {
  const parts: string[] = [input.movementName.trim() || "Movement"];

  if (input.repsPrescribed != null) {
    parts.push(`${input.repsPrescribed} ${input.repsPrescribed === 1 ? "Rep" : "Reps"}`);
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
