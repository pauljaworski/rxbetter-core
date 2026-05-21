import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import {
  buildDefinitionMap,
  type BenchmarkDefinitionRow,
} from "@/lib/programming/percent-calculator";

export type BenchmarkDefinitionsCache = {
  rows: BenchmarkDefinitionRow[];
  idByTypeAndRep: Map<string, string>;
  byId: Map<string, BenchmarkDefinitionRow>;
};

const EMPTY: BenchmarkDefinitionsCache = {
  rows: [],
  idByTypeAndRep: new Map(),
  byId: new Map(),
};

export function useBenchmarkDefinitions() {
  const loader = useCallback(async (): Promise<BenchmarkDefinitionsCache> => {
    const { data, error } = await supabase
      .from("benchmark_definition")
      .select("id, benchmark_type_id, rep_count");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as BenchmarkDefinitionRow[];
    const byId = new Map(rows.map((r) => [r.id, r]));
    return {
      rows,
      idByTypeAndRep: buildDefinitionMap(rows),
      byId,
    };
  }, []);

  return useAsyncState(loader, [], EMPTY, () => false);
}
