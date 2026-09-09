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

/**
 * Bind a 1RM definition only when the programmer prescribed a % of PR and
 * the persisted row is missing benchmark_definition_id.
 *
 * Skip-% / absolute-weight sets keep the movement type but persist a null
 * definition. Inventing 1RM here made Today/Calendar working-set logs write
 * into the PR vault.
 */
export function needsDefaultPrDefinition(item: {
  benchmark_definition_id?: string | null;
  benchmark_type_id?: string | null;
  prescribed_percentage?: number | null;
}): boolean {
  return (
    !item.benchmark_definition_id &&
    !!item.benchmark_type_id &&
    item.prescribed_percentage != null
  );
}

export function enrichLogLineItemsWithMap(
  items: LogLineItem[],
  map: Map<string, string>,
): LogLineItem[] {
  return items.map((it) => {
    if (!needsDefaultPrDefinition(it)) return it;
    const defId = resolveDefinitionId(map, it.benchmark_type_id, 1);
    return defId ? { ...it, benchmark_definition_id: defId } : it;
  });
}

export async function enrichLogLineItems(items: LogLineItem[]): Promise<LogLineItem[]> {
  const needsMap = items.some((i) => needsDefaultPrDefinition(i));
  if (!needsMap) return items;
  const map = await loadDefinitionMapCached();
  return enrichLogLineItemsWithMap(items, map);
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
