import { supabase } from "@/lib/supabase";
import { isMetconSegment } from "@/lib/programming/manual-config";

export type CompletionMaps = {
  completedProgramIds: Set<string>;
  completedGroupIds: Set<string>;
};

/** Pure check: strength/complex segment done when every PLI has a logged performance. */
export function isPrescriptionSegmentComplete(
  programmingSegment: string | null,
  lineItemIds: string[],
  loggedLineItemIds: Set<string>,
  hasSegmentScore: boolean,
): boolean {
  if (isMetconSegment(programmingSegment ?? "")) {
    return hasSegmentScore;
  }
  if (!lineItemIds.length) return false;
  return lineItemIds.every((id) => loggedLineItemIds.has(id));
}

export function isGroupBlockComplete(hasGroupScore: boolean): boolean {
  return hasGroupScore;
}

/** After logging, verify DB state and upsert completion row if criteria met. */
export async function tryMarkProgrammingSegmentComplete(
  contactId: string,
  programmingId: string,
  wodDate: string,
  programmingSegment: string | null,
): Promise<void> {
  if (isMetconSegment(programmingSegment ?? "")) {
    const { data: segPerf } = await supabase
      .from("athlete_performance")
      .select("id, score")
      .eq("contact_id", contactId)
      .eq("programming_id", programmingId)
      .is("programming_line_item_id", null)
      .maybeSingle();
    if (!segPerf?.score) return;
  } else {
    const { data: items } = await supabase
      .from("programming_line_item")
      .select("id")
      .eq("programming_id", programmingId)
      .is("contact_id", null);
    const itemIds = (items ?? []).map((i) => i.id);
    if (!itemIds.length) return;

    const { data: perfs } = await supabase
      .from("athlete_performance")
      .select("programming_line_item_id, weight_lifted, status")
      .eq("contact_id", contactId)
      .in("programming_line_item_id", itemIds);

    const logged = new Set(
      (perfs ?? [])
        .filter((p) => p.programming_line_item_id && (p.weight_lifted != null || p.status))
        .map((p) => p.programming_line_item_id as string),
    );
    if (!isPrescriptionSegmentComplete(programmingSegment, itemIds, logged, false)) return;
  }

  await upsertSegmentCompletion({
    contact_id: contactId,
    programming_id: programmingId,
    segment_group_id: null,
    performance_date: wodDate,
  });
}

/** Mark multi-part block complete when group score exists. */
export async function tryMarkGroupBlockComplete(
  contactId: string,
  segmentGroupId: string,
  wodDate: string,
): Promise<void> {
  const { data: groupPerf } = await supabase
    .from("athlete_performance")
    .select("id, score")
    .eq("contact_id", contactId)
    .eq("segment_group_id", segmentGroupId)
    .is("programming_id", null)
    .maybeSingle();

  if (!groupPerf?.score) return;

  await upsertSegmentCompletion({
    contact_id: contactId,
    programming_id: null,
    segment_group_id: segmentGroupId,
    performance_date: wodDate,
  });
}

async function upsertSegmentCompletion(row: {
  contact_id: string;
  programming_id: string | null;
  segment_group_id: string | null;
  performance_date: string;
}): Promise<void> {
  const now = new Date().toISOString();
  let existingQuery = supabase
    .from("athlete_segment_completion")
    .select("id")
    .eq("contact_id", row.contact_id)
    .eq("performance_date", row.performance_date);

  if (row.programming_id) {
    existingQuery = existingQuery.eq("programming_id", row.programming_id);
  } else if (row.segment_group_id) {
    existingQuery = existingQuery.eq("segment_group_id", row.segment_group_id);
  } else {
    return;
  }

  const { data: existing } = await existingQuery.maybeSingle();
  if (existing?.id) {
    await supabase
      .from("athlete_segment_completion")
      .update({ completed_at: now })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("athlete_segment_completion").insert({
    ...row,
    completed_at: now,
  });
}

export async function loadCompletionMaps(
  contactId: string,
  performanceDate: string,
  programmingIds: string[],
  groupIds: string[],
): Promise<CompletionMaps> {
  const completedProgramIds = new Set<string>();
  const completedGroupIds = new Set<string>();
  if (!contactId) return { completedProgramIds, completedGroupIds };

  let query = supabase
    .from("athlete_segment_completion")
    .select("programming_id, segment_group_id")
    .eq("contact_id", contactId)
    .eq("performance_date", performanceDate);

  if (programmingIds.length && groupIds.length) {
    query = query.or(
      `programming_id.in.(${programmingIds.join(",")}),segment_group_id.in.(${groupIds.join(",")})`,
    );
  } else if (programmingIds.length) {
    query = query.in("programming_id", programmingIds);
  } else if (groupIds.length) {
    query = query.in("segment_group_id", groupIds);
  } else {
    return { completedProgramIds, completedGroupIds };
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    if (row.programming_id) completedProgramIds.add(row.programming_id);
    if (row.segment_group_id) completedGroupIds.add(row.segment_group_id);
  }

  return { completedProgramIds, completedGroupIds };
}
