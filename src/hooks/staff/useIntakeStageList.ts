import { useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import type { IntakeDraftPayload, IntakeStageRow } from "./types";

function rowFromDb(r: {
  id: string;
  raw_text: string;
  parsed_payload: unknown;
  parser_mode: string;
  contains_errors: boolean;
  correction_applied: boolean;
  status: string;
  committed_programming_id: string | null;
  latency_ms: number | null;
  created_at: string;
}): IntakeStageRow {
  return {
    id: r.id,
    raw_text: r.raw_text,
    parsed_payload: r.parsed_payload as IntakeDraftPayload,
    parser_mode: r.parser_mode,
    contains_errors: r.contains_errors,
    correction_applied: r.correction_applied,
    status: r.status,
    committed_programming_id: r.committed_programming_id,
    latency_ms: r.latency_ms,
    created_at: r.created_at,
  };
}

export function useIntakeStageList(activeGymId: string | null, date: Date) {
  const dateKey = format(date, "yyyy-MM-dd");

  const loader = useCallback(async (): Promise<IntakeStageRow[]> => {
    if (!activeGymId) return [];

    const { data, error } = await supabase
      .from("programming_intake_stage")
      .select(
        "id, raw_text, parsed_payload, parser_mode, contains_errors, correction_applied, status, committed_programming_id, latency_ms, created_at",
      )
      .eq("gym_id", activeGymId)
      .eq("wod_date", dateKey)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data ?? []).map(rowFromDb);
  }, [activeGymId, dateKey]);

  return useAsyncState(loader, [activeGymId, dateKey], [] as IntakeStageRow[], (d) => d.length === 0);
}
