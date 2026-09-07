/** Aggregate line-item lift logs into a leaderboard-friendly segment score. */
export type LiftPerfForBoard = {
  contact_id: string;
  programming_id: string | null;
  programming_line_item_id: string | null;
  weight_lifted: number | null;
  status: string | null;
  workout_scale: string | null;
  id: string;
};

export type AggregatedLiftBoardRow = {
  id: string;
  contact_id: string;
  programming_id: string;
  segment_group_id: string | null;
  score: string;
  result_value: number | null;
  workout_scale: string | null;
  programming_line_item_id: null;
};

/**
 * Build one leaderboard row per athlete when every prescribed set is logged.
 * Score shows sets completed and top successful weight.
 */
export function aggregateWeightliftingBoardRows(
  programmingId: string,
  lineItemIds: string[],
  liftPerfs: LiftPerfForBoard[],
): AggregatedLiftBoardRow[] {
  if (!lineItemIds.length) return [];
  const itemSet = new Set(lineItemIds);
  const byContact = new Map<string, LiftPerfForBoard[]>();

  for (const p of liftPerfs) {
    if (p.programming_id !== programmingId) continue;
    if (!p.programming_line_item_id || !itemSet.has(p.programming_line_item_id)) continue;
    if (p.weight_lifted == null && !p.status) continue;
    const list = byContact.get(p.contact_id) ?? [];
    list.push(p);
    byContact.set(p.contact_id, list);
  }

  const rows: AggregatedLiftBoardRow[] = [];
  for (const [contactId, perfs] of byContact) {
    const loggedItems = new Set(
      perfs
        .filter((p) => p.programming_line_item_id && (p.weight_lifted != null || p.status))
        .map((p) => p.programming_line_item_id as string),
    );
    if (![...itemSet].every((id) => loggedItems.has(id))) continue;

    const successful = perfs.filter(
      (p) => p.status !== "failed" && p.weight_lifted != null,
    );
    const top =
      successful.length > 0
        ? Math.max(...successful.map((p) => p.weight_lifted as number))
        : null;
    const failedCount = perfs.filter((p) => p.status === "failed").length;
    const score =
      top != null
        ? failedCount > 0
          ? `${top} lb · ${successful.length}/${lineItemIds.length} success`
          : `${top} lb · ${lineItemIds.length} sets`
        : `${lineItemIds.length} sets logged`;

    rows.push({
      id: perfs[0]?.id ?? `${programmingId}:${contactId}`,
      contact_id: contactId,
      programming_id: programmingId,
      segment_group_id: null,
      score,
      result_value: top,
      workout_scale: perfs[0]?.workout_scale ?? "rx",
      programming_line_item_id: null,
    });
  }

  return rows;
}
