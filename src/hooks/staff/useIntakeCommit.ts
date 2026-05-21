import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";
import { formatSupabaseError } from "@/lib/format";
import { loadDefinitionMap, saveWod } from "./useProgrammingSave";
import type { EditorWod, IntakeDraftPayload } from "./types";

export type IntakeCommitInput = {
  rawText: string;
  draft: IntakeDraftPayload;
  parserMode: "regex" | "llm" | "manual";
  latencyMs: number;
  tokenCount?: number | null;
  containsErrors: boolean;
  correctionApplied: boolean;
  displayOrder: number;
};

export function useIntakeCommit(
  activeGymId: string | null,
  contactId: string | null,
  date: Date,
  defaultLib: string | null,
) {
  const [busy, setBusy] = useState(false);
  const dateKey = format(date, "yyyy-MM-dd");

  async function rejectIntake(input: Omit<IntakeCommitInput, "displayOrder"> & { displayOrder?: number }) {
    if (!activeGymId || !contactId || !defaultLib) {
      return { error: "Missing gym, contact, or library." };
    }
    setBusy(true);
    const { error } = await supabase.from("programming_intake_stage").insert({
      gym_id: activeGymId,
      coach_contact_id: contactId,
      program_library_id: defaultLib,
      wod_date: dateKey,
      raw_text: input.rawText,
      parsed_payload: input.draft as unknown as Json,
      parser_mode: input.parserMode,
      contains_errors: input.containsErrors,
      correction_applied: input.correctionApplied,
      latency_ms: input.latencyMs,
      token_count: input.tokenCount ?? null,
      status: "rejected",
    });
    setBusy(false);
    return { error: error ? formatSupabaseError(error.message) : null };
  }

  async function commitIntake(input: IntakeCommitInput): Promise<{
    error: string | null;
    programmingId: string | null;
  }> {
    if (!activeGymId || !contactId || !defaultLib) {
      return { error: "Missing gym, contact, or library.", programmingId: null };
    }

    const primaryLib = input.draft.segment.program_library_id ?? defaultLib;
    const wod: EditorWod = {
      ...input.draft.segment,
      _new: true,
      program_library_id: primaryLib,
      program_library_ids: primaryLib ? [primaryLib] : [],
      items: input.draft.lineItems.map((it, idx) => ({
        ...it,
        _new: true,
        sequence_number: it.sequence_number ?? idx + 1,
        percent_rep_max: it.percent_rep_max ?? 1,
      })),
    };

    if (wod.items.some((it) => !it.benchmark_type_id) && wod.programming_segment === "weightlifting") {
      return {
        error: "Each strength movement needs a catalog match before saving.",
        programmingId: null,
      };
    }

    setBusy(true);
    try {
      const { data: stageRow, error: stageErr } = await supabase
        .from("programming_intake_stage")
        .insert({
          gym_id: activeGymId,
          coach_contact_id: contactId,
          program_library_id: defaultLib,
          wod_date: dateKey,
          raw_text: input.rawText,
          parsed_payload: input.draft as unknown as Json,
          parser_mode: input.parserMode,
          contains_errors: input.containsErrors,
          correction_applied: input.correctionApplied,
          latency_ms: input.latencyMs,
          token_count: input.tokenCount ?? null,
          status: "staged",
        })
        .select("id")
        .single();

      if (stageErr) throw new Error(stageErr.message);

      const defMap = await loadDefinitionMap();
      const { programmingId, error: saveErr } = await saveWod(
        activeGymId,
        dateKey,
        defaultLib,
        wod,
        input.displayOrder,
        defMap,
      );
      if (saveErr) throw new Error(saveErr);

      const { error: patchErr } = await supabase
        .from("programming_intake_stage")
        .update({
          status: "committed",
          committed_programming_id: programmingId,
        })
        .eq("id", stageRow.id);

      if (patchErr) throw new Error(patchErr.message);

      setBusy(false);
      return { error: null, programmingId };
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : String(e);
      return { error: formatSupabaseError(msg), programmingId: null };
    }
  }

  return { commitIntake, rejectIntake, busy };
}
