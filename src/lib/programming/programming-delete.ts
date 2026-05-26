import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

const DELETE_DENIED =
  "Segment could not be deleted. Confirm you have programmer access for this track, then try again.";

/** Remove a programming segment (line items cascade from parent). */
export async function deleteProgrammingSegment(
  programmingId: string,
): Promise<{ error: string | null }> {
  // Unpublish first so athletes stop seeing it even if a later step fails.
  await supabase
    .from("programming")
    .update({ published_at: null })
    .eq("id", programmingId);

  const { data: deleted, error: progErr } = await supabase
    .from("programming")
    .delete()
    .eq("id", programmingId)
    .select("id");

  if (progErr) return { error: formatSupabaseError(progErr.message) };
  if (!deleted?.length) return { error: DELETE_DENIED };

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

  const { data: removed, error: delErr } = await supabase
    .from("programming_line_item")
    .delete()
    .in("id", toDelete)
    .select("id");

  if (delErr) return { error: formatSupabaseError(delErr.message) };
  if (removed?.length !== toDelete.length) {
    return {
      error: "Some removed movements could not be deleted from the database. Save again or contact support.",
    };
  }
  return { error: null };
}
