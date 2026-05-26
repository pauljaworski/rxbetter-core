import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

/** Remove a programming segment and its gym-wide line items from the database. */
export async function deleteProgrammingSegment(
  programmingId: string,
): Promise<{ error: string | null }> {
  const { error: assignErr } = await supabase
    .from("programming_library_assignment")
    .delete()
    .eq("programming_id", programmingId);
  if (assignErr) return { error: formatSupabaseError(assignErr.message) };

  const { error: pliErr } = await supabase
    .from("programming_line_item")
    .delete()
    .eq("programming_id", programmingId)
    .is("contact_id", null);
  if (pliErr) return { error: formatSupabaseError(pliErr.message) };

  const { error: progErr } = await supabase.from("programming").delete().eq("id", programmingId);
  if (progErr) return { error: formatSupabaseError(progErr.message) };

  return { error: null };
}

/** Delete line items removed from the editor but still present in the database. */
export async function syncDeletedLineItems(
  programmingId: string,
  keptLineItemIds: string[],
): Promise<{ error: string | null }> {
  const { data: existing, error: fetchErr } = await supabase
    .from("programming_line_item")
    .select("id")
    .eq("programming_id", programmingId)
    .is("contact_id", null);
  if (fetchErr) return { error: formatSupabaseError(fetchErr.message) };

  const kept = new Set(keptLineItemIds);
  const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !kept.has(id));
  if (!toDelete.length) return { error: null };

  const { error: delErr } = await supabase
    .from("programming_line_item")
    .delete()
    .in("id", toDelete);
  if (delErr) return { error: formatSupabaseError(delErr.message) };
  return { error: null };
}
