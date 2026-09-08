/**
 * Reconstruct the editor "skip % of PR" flag from persisted line-item columns.
 * skip_pr_basis is client-only; save stores it as null definition + null percentage
 * (strength) or null PR-basis type (complex_set).
 */
export function skipPrBasisFromPersisted(item: {
  line_item_kind?: string | null;
  benchmark_type_id?: string | null;
  benchmark_definition_id?: string | null;
  prescribed_percentage?: number | null;
}): boolean {
  if (item.line_item_kind === "complex_set") {
    return !item.benchmark_type_id;
  }
  if (item.line_item_kind === "strength_set") {
    return item.benchmark_definition_id == null && item.prescribed_percentage == null;
  }
  return false;
}
