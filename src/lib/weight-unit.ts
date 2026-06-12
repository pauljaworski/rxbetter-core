export type WeightUnit = "lb" | "kg";

const LB_PER_KG = 2.2046226218;

/** PRs and prescribed loads are stored in lb in the database. */
export function lbToDisplay(lb: number | null | undefined, unit: WeightUnit): number | null {
  if (lb == null || Number.isNaN(lb)) return null;
  if (unit === "kg") return Math.round((lb / LB_PER_KG) * 10) / 10;
  return Math.round(lb);
}

export function displayToLb(value: number, unit: WeightUnit): number {
  if (unit === "kg") return Math.round(value * LB_PER_KG);
  return Math.round(value);
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit;
}

export function fmtWeightWithUnit(
  lb: number | null | undefined,
  unit: WeightUnit = "lb",
): string {
  const v = lbToDisplay(lb, unit);
  if (v == null) return "—";
  return `${v}`;
}
