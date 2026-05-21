import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import type { BenchmarkTypeOption } from "./types";

export function useBenchmarkCatalog() {
  const loader = useCallback(async (): Promise<BenchmarkTypeOption[]> => {
    const { data, error } = await supabase
      .from("benchmark_type")
      .select("id, name, stimulus, sub_stimulus, purpose_variation")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as BenchmarkTypeOption[];
  }, []);

  return useAsyncState(loader, [], [] as BenchmarkTypeOption[], (d) => d.length === 0);
}
