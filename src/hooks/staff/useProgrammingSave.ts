import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { EditorWod } from "./types";
import { validateProgrammingEditorInput } from "./programmingEditor";

export function useProgrammingSave(
  activeGymId: string | null,
  date: Date,
  defaultLib: string | null,
) {
  const [busy, setBusy] = useState(false);
  const dateKey = format(date, "yyyy-MM-dd");

  async function saveAll(wods: EditorWod[]): Promise<{ error: string | null; wods: EditorWod[] }> {
    const savedWods = wods.map((w) => ({
      ...w,
      items: w.items.map((it) => ({ ...it })),
    }));

    if (!activeGymId) {
      return { error: "No active gym selected.", wods: savedWods };
    }
    if (!defaultLib) {
      return { error: "Pick a program library before saving.", wods: savedWods };
    }

    const validationError = validateProgrammingEditorInput(savedWods);
    if (validationError) {
      return { error: validationError, wods: savedWods };
    }

    setBusy(true);
    try {
      const { data: existingPrograms, error: existingProgramsError } = await supabase
        .from("programming")
        .select("id")
        .eq("gym_id", activeGymId)
        .eq("wod_date", dateKey)
        .eq("source", "gym");
      if (existingProgramsError) throw new Error(existingProgramsError.message);

      const existingProgramIds = new Set((existingPrograms ?? []).map((p) => p.id));
      const requestedProgramIds = new Set(
        savedWods.map((w) => w.id).filter((id): id is string => Boolean(id)),
      );
      const deletedProgramIds = Array.from(existingProgramIds).filter((id) => !requestedProgramIds.has(id));
      const keptProgramIds = Array.from(existingProgramIds).filter((id) => requestedProgramIds.has(id));

      let deletedLineItemIds: string[] = [];
      if (keptProgramIds.length) {
        const { data: existingItems, error: existingItemsError } = await supabase
          .from("programming_line_item")
          .select("id, programming_id")
          .in("programming_id", keptProgramIds)
          .is("contact_id", null);
        if (existingItemsError) throw new Error(existingItemsError.message);

        const requestedItemIds = new Set(
          savedWods
            .flatMap((w) => w.items)
            .map((it) => it.id)
            .filter((id): id is string => Boolean(id)),
        );
        deletedLineItemIds = (existingItems ?? [])
          .filter((it) => !requestedItemIds.has(it.id))
          .map((it) => it.id);
      }

      for (let i = 0; i < savedWods.length; i++) {
        const w = savedWods[i];
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
          savedWods[i] = { ...w, id: progId, _new: false, display_order: i };
        } else {
          const { data, error } = await supabase
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
            .eq("id", progId)
            .eq("gym_id", activeGymId)
            .eq("wod_date", dateKey)
            .eq("source", "gym")
            .select("id")
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (!data) throw new Error("Programming changed gyms or dates. Reload and try again.");
          savedWods[i] = { ...w, _new: false, display_order: i };
        }

        for (let j = 0; j < w.items.length; j++) {
          const it = w.items[j];
          if (it._new || !it.id) {
            const { data, error } = await supabase
              .from("programming_line_item")
              .insert({
                programming_id: progId,
                sequence_number: j + 1,
                reps_prescribed: it.reps_prescribed,
                prescribed_weight: it.prescribed_weight,
                prescribed_percentage: it.prescribed_percentage,
                prescribed_score: it.prescribed_score,
                benchmark_type_id: it.benchmark_type_id,
                contact_id: null,
              })
              .select("id")
              .single();
            if (error) throw new Error(error.message);
            savedWods[i].items[j] = { ...it, id: data.id, _new: false, sequence_number: j + 1 };
          } else {
            const { data, error } = await supabase
              .from("programming_line_item")
              .update({
                sequence_number: j + 1,
                reps_prescribed: it.reps_prescribed,
                prescribed_weight: it.prescribed_weight,
                prescribed_percentage: it.prescribed_percentage,
                prescribed_score: it.prescribed_score,
                benchmark_type_id: it.benchmark_type_id,
              })
              .eq("id", it.id)
              .select("id")
              .maybeSingle();
            if (error) throw new Error(error.message);
            if (!data) throw new Error("Programming movement changed. Reload and try again.");
            savedWods[i].items[j] = { ...it, _new: false, sequence_number: j + 1 };
          }
        }
      }

      if (deletedLineItemIds.length) {
        const { error } = await supabase
          .from("programming_line_item")
          .delete()
          .in("id", deletedLineItemIds);
        if (error) throw new Error(error.message);
      }

      if (deletedProgramIds.length) {
        const { error } = await supabase
          .from("programming")
          .delete()
          .eq("gym_id", activeGymId)
          .eq("wod_date", dateKey)
          .eq("source", "gym")
          .in("id", deletedProgramIds);
        if (error) throw new Error(error.message);
      }

      return { error: null, wods: savedWods };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: formatSupabaseError(msg), wods: savedWods };
    } finally {
      setBusy(false);
    }
  }

  return { saveAll, busy };
}
