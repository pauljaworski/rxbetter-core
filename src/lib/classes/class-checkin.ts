import { supabase } from "@/lib/supabase";

const checkinFrom = () => supabase.from("athlete_class_checkin");

export type ClassSlot = {
  key: string;
  time: string;
  label: string;
  durationMin: number;
  type: string;
};

export type ClassCheckin = {
  id: string;
  gym_id: string;
  contact_id: string;
  class_date: string;
  start_time: string;
  label: string;
  class_type: string | null;
  duration_min: number;
};

/** Default weekly class board (CrossFit gym style). */
export function defaultClassesForDay(date: Date): ClassSlot[] {
  const dow = date.getDay();
  const weekday: ClassSlot[] = [
    { key: "0600", time: "06:00", label: "6:00 AM", durationMin: 60, type: "CrossFit" },
    { key: "0900", time: "09:00", label: "9:00 AM", durationMin: 60, type: "CrossFit" },
    { key: "1200", time: "12:00", label: "12:00 PM", durationMin: 45, type: "CrossFit" },
    { key: "1730", time: "17:30", label: "5:30 PM", durationMin: 60, type: "CrossFit" },
    { key: "1830", time: "18:30", label: "6:30 PM", durationMin: 60, type: "CrossFit" },
  ];
  const sat: ClassSlot[] = [
    { key: "0800", time: "08:00", label: "8:00 AM", durationMin: 60, type: "Partner WOD" },
    { key: "0900", time: "09:00", label: "9:00 AM", durationMin: 60, type: "CrossFit" },
  ];
  const sun: ClassSlot[] = [
    { key: "0900", time: "09:00", label: "9:00 AM", durationMin: 60, type: "Open Gym" },
  ];
  if (dow === 0) return sun;
  if (dow === 6) return sat;
  return weekday;
}

function normalizeTime(t: string): string {
  return t.slice(0, 5);
}

export async function fetchCheckinsForDay(
  gymId: string,
  contactId: string,
  dateKey: string,
): Promise<ClassCheckin[]> {
  const { data, error } = await checkinFrom()
    .select("id, gym_id, contact_id, class_date, start_time, label, class_type, duration_min")
    .eq("gym_id", gymId)
    .eq("contact_id", contactId)
    .eq("class_date", dateKey);
  if (error) throw new Error(error.message);
  return ((data ?? []) as ClassCheckin[]).map((r) => ({
    ...r,
    start_time: normalizeTime(r.start_time),
  }));
}

/** All check-ins for a gym day (roster). */
export async function fetchGymDayCheckins(
  gymId: string,
  dateKey: string,
): Promise<ClassCheckin[]> {
  const { data, error } = await checkinFrom()
    .select("id, gym_id, contact_id, class_date, start_time, label, class_type, duration_min")
    .eq("gym_id", gymId)
    .eq("class_date", dateKey);
  if (error) throw new Error(error.message);
  return ((data ?? []) as ClassCheckin[]).map((r) => ({
    ...r,
    start_time: normalizeTime(r.start_time),
  }));
}

export async function checkIntoClass(input: {
  gymId: string;
  contactId: string;
  dateKey: string;
  slot: ClassSlot;
}): Promise<{ error: string | null }> {
  const { error } = await checkinFrom().upsert(
    {
      gym_id: input.gymId,
      contact_id: input.contactId,
      class_date: input.dateKey,
      start_time: input.slot.time,
      label: input.slot.label,
      class_type: input.slot.type,
      duration_min: input.slot.durationMin,
    },
    { onConflict: "gym_id,contact_id,class_date,start_time" },
  );
  return { error: error?.message ?? null };
}

export async function cancelClassCheckin(checkinId: string): Promise<{ error: string | null }> {
  const { error } = await checkinFrom().delete().eq("id", checkinId);
  return { error: error?.message ?? null };
}
