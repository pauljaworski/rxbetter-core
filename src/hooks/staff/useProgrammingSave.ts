import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { EditorWod } from "./types";

export type SaveWodResult = { programmingId: string | null; error: string | null };

export async function saveWod(
  activeGymId: string,
  dateKey: string,
  defaultLib: string,
  wod: EditorWod,
  displayOrder: number,
): Promise<SaveWodResult> {
  const lib = wod.program_library_id ?? defaultLib;
  let progId = wod.id;

  try {
    if (wod._new || !progId) {
      const { data, error } = await supabase
        .from("programming")
        .insert({
          gym_id: activeGymId,
          program_library_id: lib,
          wod_date: dateKey,
          name: wod.name,
          description: wod.description,
          programming_segment: wod.programming_segment,
          metcon_format: wod.metcon_format,
          athlete_notes: wod.athlete_notes,
          coaches_notes: wod.coaches_notes,
          display_order: displayOrder,
          source: "gym",
          prescribed_scale: "rx",
          created_by_contact_id: null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      progId = data.id;
    } else {
      const { error } = await supabase
        .from("programming")
        .update({
          name: wod.name,
          description: wod.description,
          programming_segment: wod.programming_segment,
          metcon_format: wod.metcon_format,
          athlete_notes: wod.athlete_notes,
          coaches_notes: wod.coaches_notes,
          display_order: displayOrder,
          program_library_id: lib,
        })
        .eq("id", progId);
      if (error) throw new Error(error.message);
    }

    for (let j = 0; j < wod.items.length; j++) {
      const it = wod.items[j];
      if (it._new || !it.id) {
        const { error } = await supabase.from("programming_line_item").insert({
          programming_id: progId,
          sequence_number: j + 1,
          reps_prescribed: it.reps_prescribed,
          prescribed_weight: it.prescribed_weight,
          prescribed_percentage: it.prescribed_percentage,
          prescribed_score: it.prescribed_score,
          benchmark_type_id: it.benchmark_type_id,
          contact_id: null,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("programming_line_item")
          .update({
            sequence_number: j + 1,
            reps_prescribed: it.reps_prescribed,
            prescribed_weight: it.prescribed_weight,
            prescribed_percentage: it.prescribed_percentage,
            prescribed_score: it.prescribed_score,
            benchmark_type_id: it.benchmark_type_id,
          })
          .eq("id", it.id);
        if (error) throw new Error(error.message);
      }
    }

    return { programmingId: progId, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { programmingId: null, error: formatSupabaseError(msg) };
  }
}

export function useProgrammingSave(
  activeGymId: string | null,
  date: Date,
  defaultLib: string | null,
) {
  const [busy, setBusy] = useState(false);
  const dateKey = format(date, "yyyy-MM-dd");

  async function saveAll(wods: EditorWod[]): Promise<{ error: string | null }> {
    if (!activeGymId) {
      return { error: "No active gym selected." };
    }
    if (!defaultLib) {
      return { error: "Pick a program library before saving." };
    }

    setBusy(true);
    try {
      for (let i = 0; i < wods.length; i++) {
        const { error } = await saveWod(activeGymId, dateKey, defaultLib, wods[i], i);
        if (error) throw new Error(error);
      }
      setBusy(false);
      return { error: null };
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : String(e);
      return { error: formatSupabaseError(msg) };
    }
  }

  return { saveAll, saveWod: (wod: EditorWod, order: number) => saveWod(activeGymId!, dateKey, defaultLib!, wod, order), busy };
}
