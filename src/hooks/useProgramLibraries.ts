import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "./useAsyncState";
import type { ProgramLibrary } from "./staff/types";

export function useProgramLibraries(activeGymId: string | null) {
  const loader = useCallback(async (): Promise<ProgramLibrary[]> => {
    if (!activeGymId) return [];

    const { data, error } = await supabase
      .from("program_library")
      .select("id, name")
      .eq("gym_id", activeGymId)
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    return (data ?? []) as ProgramLibrary[];
  }, [activeGymId]);

  return useAsyncState(loader, [activeGymId], [] as ProgramLibrary[], (d) => d.length === 0);
}
