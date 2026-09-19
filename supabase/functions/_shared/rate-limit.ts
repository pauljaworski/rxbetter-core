import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";

/** Coach WOD-parse daily limit (existing). */
export async function checkLlmRateLimit(
  admin: SupabaseClient,
  gymId: string,
  coachContactId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const limit = Number(Deno.env.get("WOD_PARSE_DAILY_LIMIT") ?? "30");
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("programming_intake_stage")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("coach_contact_id", coachContactId)
    .eq("parser_mode", "llm")
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    console.error("rate limit check failed", error);
    return { ok: true };
  }

  if ((count ?? 0) >= limit) {
    return {
      ok: false,
      message: `Daily AI parse limit (${limit}) reached. Try again tomorrow or use manual parse.`,
    };
  }

  return { ok: true };
}

/**
 * Athlete AI daily limit (insights / metcon strategy).
 * Uses ai_request_log when present; fails open if the table is missing.
 */
export async function checkAthleteAiRateLimit(
  admin: SupabaseClient,
  contactId: string,
  kind: "insights" | "metcon_strategy",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const limit = Number(Deno.env.get("ATHLETE_AI_DAILY_LIMIT") ?? "20");
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("ai_request_log")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId)
    .eq("kind", kind)
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    // Table may not be pushed yet — allow request.
    console.error("athlete AI rate limit check failed", error.message);
    return { ok: true };
  }

  if ((count ?? 0) >= limit) {
    return {
      ok: false,
      message: `Daily AI limit (${limit}) for ${kind.replace("_", " ")} reached. Try again tomorrow.`,
    };
  }

  return { ok: true };
}

export async function logAthleteAiRequest(
  admin: SupabaseClient,
  input: {
    contactId: string;
    gymId: string | null;
    kind: "insights" | "metcon_strategy";
  },
): Promise<void> {
  const { error } = await admin.from("ai_request_log").insert({
    contact_id: input.contactId,
    gym_id: input.gymId,
    kind: input.kind,
  });
  if (error) console.error("ai_request_log insert failed", error.message);
}

/** Confirm the authenticated contact is an active member of the gym. */
export async function authorizeGymMember(
  admin: SupabaseClient,
  contactId: string,
  gymId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("fitness_membership")
    .select("id")
    .eq("gym_id", gymId)
    .eq("contact_id", contactId)
    .eq("membership_status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("gym membership check failed", error.message);
    return { ok: false, error: "Could not verify gym membership" };
  }
  if (!data) return { ok: false, error: "Not an active member of this gym" };
  return { ok: true };
}
