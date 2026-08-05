import { supabase } from "@/lib/supabase";

/** Natural keys for class/personal score rows (excludes free-form PR vault / import lifts). */
export type PerformanceLedgerKey =
  | { kind: "line_item"; contactId: string; lineItemId: string }
  | { kind: "segment"; contactId: string; programmingId: string }
  | { kind: "group"; contactId: string; segmentGroupId: string; performanceDate: string };

export function isUniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  const msg = (error.message ?? "").toLowerCase();
  return (
    msg.includes("duplicate key") ||
    msg.includes("athlete_performance_contact_pli_uidx") ||
    msg.includes("athlete_performance_contact_segment_uidx") ||
    msg.includes("athlete_performance_contact_group_date_uidx")
  );
}

/** Look up an existing ledger row by natural key (post-unique-index safe). */
export async function findExistingPerformanceId(
  key: PerformanceLedgerKey,
): Promise<string | null> {
  if (key.kind === "line_item") {
    const { data, error } = await supabase
      .from("athlete_performance")
      .select("id")
      .eq("contact_id", key.contactId)
      .eq("programming_line_item_id", key.lineItemId)
      .maybeSingle();
    if (error) return null;
    return data?.id ?? null;
  }

  if (key.kind === "segment") {
    const { data, error } = await supabase
      .from("athlete_performance")
      .select("id")
      .eq("contact_id", key.contactId)
      .eq("programming_id", key.programmingId)
      .is("programming_line_item_id", null)
      .is("segment_group_id", null)
      .maybeSingle();
    if (error) return null;
    return data?.id ?? null;
  }

  const { data, error } = await supabase
    .from("athlete_performance")
    .select("id")
    .eq("contact_id", key.contactId)
    .eq("segment_group_id", key.segmentGroupId)
    .eq("performance_date", key.performanceDate)
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

/** Prefer caller existingId; otherwise resolve by natural key before insert. */
export async function resolvePerformanceIdForSave(
  existingId: string | undefined,
  key: PerformanceLedgerKey,
): Promise<string | undefined> {
  if (existingId) return existingId;
  return (await findExistingPerformanceId(key)) ?? undefined;
}
