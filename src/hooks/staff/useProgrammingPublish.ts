import { useState } from "react";
import { addDays, format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

export async function publishProgrammingRange(
  activeGymId: string,
  startDate: string,
  endDate: string,
): Promise<{ count: number; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("programming")
    .update({ published_at: now })
    .eq("gym_id", activeGymId)
    .eq("source", "gym")
    .gte("wod_date", startDate)
    .lte("wod_date", endDate)
    .is("published_at", null)
    .select("id");

  if (error) return { count: 0, error: formatSupabaseError(error.message) };
  return { count: data?.length ?? 0, error: null };
}

export function useProgrammingPublish(activeGymId: string | null) {
  const [busy, setBusy] = useState(false);

  async function publishDay(date: Date): Promise<{ error: string | null; count: number }> {
    if (!activeGymId) return { error: "No active gym.", count: 0 };
    setBusy(true);
    const key = format(date, "yyyy-MM-dd");
    const { count, error } = await publishProgrammingRange(activeGymId, key, key);
    setBusy(false);
    return { error, count };
  }

  async function publishWeek(weekStart: Date): Promise<{ error: string | null; count: number }> {
    if (!activeGymId) return { error: "No active gym.", count: 0 };
    setBusy(true);
    const start = format(weekStart, "yyyy-MM-dd");
    const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const { count, error } = await publishProgrammingRange(activeGymId, start, end);
    setBusy(false);
    return { error, count };
  }

  return { publishDay, publishWeek, busy };
}
