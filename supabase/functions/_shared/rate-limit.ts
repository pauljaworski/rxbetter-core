import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";

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
