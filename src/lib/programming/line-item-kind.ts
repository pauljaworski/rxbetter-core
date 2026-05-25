export const LINE_ITEM_KINDS = [
  "strength_set",
  "complex_set",
  "metcon_movement",
  "rest",
  "note",
] as const;

export type LineItemKind = (typeof LINE_ITEM_KINDS)[number];

export function isLineItemKind(value: string): value is LineItemKind {
  return (LINE_ITEM_KINDS as readonly string[]).includes(value);
}

export function defaultLineItemKindForSegment(programmingSegment: string): LineItemKind {
  if (programmingSegment === "metcon") return "metcon_movement";
  if (programmingSegment === "weightlifting") return "strength_set";
  return "note";
}
