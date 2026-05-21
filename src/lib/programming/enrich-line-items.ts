import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import {
  buildDefinitionMap,
  resolveDefinitionId,
  type BenchmarkDefinitionRow,
} from "@/lib/programming/percent-calculator";
import { supabase } from "@/lib/supabase";

let definitionMapCache: Map<string, string> | null = null;

async function loadDefinitionMapCached(): Promise<Map<string, string>> {
  if (definitionMapCache) return definitionMapCache;
  const { data, error } = await supabase
    .from("benchmark_definition")
    .select("id, benchmark_type_id, rep_count");
  if (error) throw new Error(error.message);
  definitionMapCache = buildDefinitionMap((data ?? []) as BenchmarkDefinitionRow[]);
  return definitionMapCache;
}

/** Ensure line items have benchmark_definition_id when type is known (defaults to 1RM). */
export async function enrichLogLineItems(items: LogLineItem[]): Promise<LogLineItem[]> {
  const needsMap = items.some((i) => !i.benchmark_definition_id && i.benchmark_type_id);
  if (!needsMap) return items;
  const map = await loadDefinitionMapCached();
  return items.map((it) => {
    if (it.benchmark_definition_id || !it.benchmark_type_id) return it;
    const defId = resolveDefinitionId(map, it.benchmark_type_id, 1);
    return defId ? { ...it, benchmark_definition_id: defId } : it;
  });
}

export async function loadRepCountForDefinition(
  benchmarkDefinitionId: string | null,
): Promise<number> {
  if (!benchmarkDefinitionId) return 1;
  const { data } = await supabase
    .from("benchmark_definition")
    .select("rep_count")
    .eq("id", benchmarkDefinitionId)
    .maybeSingle();
  return data?.rep_count ?? 1;
}
