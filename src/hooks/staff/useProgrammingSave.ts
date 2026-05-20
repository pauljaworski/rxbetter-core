import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { EditorWod } from "./types";

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
        const w = wods[i];
        const lib = w.program_library_id ?? defaultLib;
        let progId = w.id;

        if (w._new || !progId) {
          const { data, error } = await supabase
            .from("programming")
            .insert({
              gym_id: activeGymId,
              program_library_id: lib,
              wod_date: dateKey,
              name: w.name,
              description: w.description,
              programming_segment: w.programming_segment,
              metcon_format: w.metcon_format,
              athlete_notes: w.athlete_notes,
              coaches_notes: w.coaches_notes,
              display_order: i,
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
              name: w.name,
              description: w.description,
              programming_segment: w.programming_segment,
              metcon_format: w.metcon_format,
              athlete_notes: w.athlete_notes,
              coaches_notes: w.coaches_notes,
              display_order: i,
              program_library_id: lib,
            })
            .eq("id", progId);
          if (error) throw new Error(error.message);
        }

        for (let j = 0; j < w.items.length; j++) {
          const it = w.items[j];
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
      }
      setBusy(false);
      return { error: null };
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : String(e);
      return { error: formatSupabaseError(msg) };
    }
  }

  return { saveAll, busy };
}
