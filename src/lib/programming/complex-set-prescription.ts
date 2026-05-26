import type { LineItemKind } from "@/lib/programming/line-item-kind";

/** On complex_set rows, reps_prescribed is the number of sets (not total reps). */
export function isComplexSetLineItem(item: {
  line_item_kind?: LineItemKind | string | null;
}): boolean {
  return item.line_item_kind === "complex_set";
}

export function prescriptionUnitForLineItem(item: {
  line_item_kind?: LineItemKind | string | null;
  prescription_unit?: string | null;
}): string {
  if (isComplexSetLineItem(item)) return "sets";
  return item.prescription_unit ?? "reps";
}
