import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

const DELETE_DENIED =
  "Segment could not be deleted. Confirm you have programmer access for this track, then try again.";

/** Remove a programming segment via security-definer RPC (bypasses child-table RLS). */
export async function deleteProgrammingSegment(
  programmingId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("delete_gym_programming_segment", {
    p_programming_id: programmingId,
  });

  if (error) {
    const msg = formatSupabaseError(error.message);
    if (/not allowed/i.test(msg)) return { error: DELETE_DENIED };
    return { error: msg };
  }

  return { error: null };
}

/** Replace track assignments for a segment (save section). */
export async function syncProgrammingLibraryAssignments(
  programmingId: string,
  libraryIds: string[],
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("sync_programming_library_assignments", {
    p_programming_id: programmingId,
    p_library_ids: libraryIds,
  });

  if (error) return { error: formatSupabaseError(error.message) };
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
