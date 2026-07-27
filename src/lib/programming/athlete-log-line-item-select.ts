/**
 * Shared programming_line_item columns required for athlete Today/Calendar logging.
 * Calendar must stay in sync with Today so gender Rx, units, and complexes resolve.
 */
export const ATHLETE_LOG_LINE_ITEM_SELECT =
  "id, programming_id, sequence_number, reps_prescribed, prescription_unit, prescribed_percentage, prescribed_weight, prescribed_score, status, benchmark_definition_id, benchmark_type_id, contact_id, movement_label, line_item_kind, movement_components, rx_variants";
