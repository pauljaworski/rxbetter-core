import type { EditorLineItem } from "@/hooks/staff/types";
import type { LineItemKind } from "@/lib/programming/line-item-kind";

/** Each complex_set row is one set; reps live on movement_components. */
export function isComplexSetLineItem(item: {
  line_item_kind?: LineItemKind | string | null;
}): boolean {
  return item.line_item_kind === "complex_set";
}

/** Legacy rows stored set count on reps_prescribed with prescription_unit = sets. */
export function isLegacyMultiSetComplex(item: {
  line_item_kind?: LineItemKind | string | null;
  reps_prescribed?: number | null;
  prescription_unit?: string | null;
}): boolean {
  return (
    isComplexSetLineItem(item) &&
    (item.prescription_unit === "sets" || item.prescription_unit == null) &&
    (item.reps_prescribed ?? 0) > 1
  );
}

/** Split legacy multi-set complex rows into one editor line item per set. */
export function expandComplexSetLineItems(items: EditorLineItem[]): EditorLineItem[] {
  const out: EditorLineItem[] = [];
  for (const it of items) {
    if (isLegacyMultiSetComplex(it)) {
      const count = it.reps_prescribed!;
      for (let i = 0; i < count; i++) {
        out.push({
          ...it,
          ...(i > 0 ? { id: undefined, _new: true as const } : {}),
          reps_prescribed: null,
          prescription_unit: null,
        });
      }
      continue;
    }
    if (isComplexSetLineItem(it) && it.prescription_unit === "sets") {
      out.push({
        ...it,
        reps_prescribed: it.reps_prescribed === 1 ? null : it.reps_prescribed,
        prescription_unit: null,
      });
      continue;
    }
    out.push(it);
  }
  return out.map((it, idx) => ({ ...it, sequence_number: idx + 1 }));
}

export function prescriptionUnitForLineItem(item: {
  line_item_kind?: LineItemKind | string | null;
  prescription_unit?: string | null;
}): string {
  if (isComplexSetLineItem(item)) {
    return item.prescription_unit ?? "reps";
  }
  return item.prescription_unit ?? "reps";
}
