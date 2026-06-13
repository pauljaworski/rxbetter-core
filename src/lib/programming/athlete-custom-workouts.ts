import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

export type AthleteCustomWorkout = {
  id: string;
  name: string | null;
  wod_date: string;
  programming_segment: string | null;
  athlete_notes: string | null;
  description: string | null;
};

export type CreateCustomWorkoutInput = {
  contactId: string;
  gymId: string | null;
  wodDate: string;
  name: string;
  segment: string;
  notes?: string;
  movements: string[];
};

export async function fetchAthleteCustomWorkouts(
  contactId: string,
  startDate: string,
  endDate: string,
): Promise<AthleteCustomWorkout[]> {
  const { data, error } = await supabase
    .from("programming")
    .select("id, name, wod_date, programming_segment, athlete_notes, description")
    .eq("source", "athlete_custom")
    .eq("created_by_contact_id", contactId)
    .gte("wod_date", startDate)
    .lte("wod_date", endDate)
    .order("wod_date", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AthleteCustomWorkout[];
}

export async function createAthleteCustomWorkout(
  input: CreateCustomWorkoutInput,
): Promise<{ id: string | null; error: string | null }> {
  const now = new Date().toISOString();
  const segment = input.segment || "metcon";
  const isMetcon = segment === "metcon" || segment === "hiit";

  const { data: prog, error: progErr } = await supabase
    .from("programming")
    .insert({
      name: input.name.trim(),
      wod_date: input.wodDate,
      programming_segment: segment,
      programming_subtype: segment === "strength" ? "strength" : null,
      athlete_notes: input.notes?.trim() || null,
      source: "athlete_custom",
      created_by_contact_id: input.contactId,
      gym_id: input.gymId,
      program_library_id: null,
      published_at: now,
      display_order: 0,
      workout_scheme: isMetcon ? { kind: "amrap", durationMin: 20 } : {},
      metcon_format: isMetcon ? "amrap" : null,
    })
    .select("id")
    .single();

  if (progErr) return { id: null, error: formatSupabaseError(progErr.message) };

  const movements = input.movements.filter((m) => m.trim());
  if (movements.length) {
    const rows = movements.map((label, idx) => ({
      programming_id: prog.id,
      sequence_number: idx + 1,
      movement_label: label.trim(),
      line_item_kind: segment === "strength" ? "strength_set" : "metcon_movement",
      contact_id: null,
    }));
    const { error: itemErr } = await supabase.from("programming_line_item").insert(rows);
    if (itemErr) return { id: prog.id, error: formatSupabaseError(itemErr.message) };
  }

  return { id: prog.id, error: null };
}

export async function deleteAthleteCustomWorkout(
  programmingId: string,
  contactId: string,
): Promise<{ error: string | null }> {
  const { error: itemErr } = await supabase
    .from("programming_line_item")
    .delete()
    .eq("programming_id", programmingId);
  if (itemErr) return { error: formatSupabaseError(itemErr.message) };

  const { error } = await supabase
    .from("programming")
    .delete()
    .eq("id", programmingId)
    .eq("created_by_contact_id", contactId)
    .eq("source", "athlete_custom");

  return { error: error ? formatSupabaseError(error.message) : null };
}
