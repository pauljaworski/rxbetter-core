export const PRESCRIPTION_UNITS = ["reps", "meters", "calories", "feet"] as const;

export type PrescriptionUnit = (typeof PRESCRIPTION_UNITS)[number];

export function isPrescriptionUnit(v: string): v is PrescriptionUnit {
  return (PRESCRIPTION_UNITS as readonly string[]).includes(v);
}

export function formatPrescriptionAmount(
  amount: number | null | undefined,
  unit: PrescriptionUnit | string | null | undefined,
): string | null {
  if (amount == null) return null;
  const u = unit ?? "reps";
  switch (u) {
    case "meters":
      return `${amount}m`;
    case "calories":
      return `${amount} cal`;
    case "feet":
      return `${amount} ft`;
    case "sets":
      return `${amount} ${amount === 1 ? "set" : "sets"}`;
    default:
      return `${amount} ${amount === 1 ? "Rep" : "Reps"}`;
  }
}

export function inferUnitFromToken(token: string): {
  amount: number | null;
  unit: PrescriptionUnit;
  label: string;
} {
  const t = token.trim();
  const distanceM = t.match(/^(\d+)\s*m(?:eter)?s?\s+(.+)$/i);
  if (distanceM) {
    return { amount: Number(distanceM[1]), unit: "meters", label: distanceM[2].trim() };
  }
  const distanceFt = t.match(/^(\d+)\s*(?:ft|feet)\s+(.+)$/i);
  if (distanceFt) {
    return { amount: Number(distanceFt[1]), unit: "feet", label: distanceFt[2].trim() };
  }
  const cal = t.match(/^(\d+)\s*(?:\/\d+\s*)?cal(?:ories)?\s+(.+)$/i);
  if (cal) {
    return { amount: Number(cal[1]), unit: "calories", label: cal[2].trim() };
  }
  const repsFirst = t.match(/^(\d+)\s+(.+)$/);
  if (repsFirst) {
    return { amount: Number(repsFirst[1]), unit: "reps", label: repsFirst[2].trim() };
  }
  return { amount: null, unit: "reps", label: t };
}
