import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import { recomputeBenchmarkSummary } from "@/lib/pr/record-athlete-pr";
import type { PreparedImportRow } from "./prepare-import-rows";

export type CommitImportResult = {
  inserted: number;
  skipped: number;
  duplicates: number;
  errors: string[];
};

type ExistingPerfKey = string;

function perfKey(
  date: string,
  definitionId: string | null,
  weight: number | null,
  score: string | null,
): ExistingPerfKey {
  return `${date}|${definitionId ?? ""}|${weight ?? ""}|${score ?? ""}`;
}

async function fetchExistingKeys(contactId: string): Promise<Set<ExistingPerfKey>> {
  const { data, error } = await supabase
    .from("athlete_performance")
    .select("performance_date, benchmark_definition_id, weight_lifted, score")
    .eq("contact_id", contactId);

  if (error) throw new Error(formatSupabaseError(error.message));

  const keys = new Set<ExistingPerfKey>();
  for (const row of data ?? []) {
    const date = row.performance_date?.slice(0, 10);
    if (!date) continue;
    keys.add(
      perfKey(
        date,
        row.benchmark_definition_id,
        row.weight_lifted != null ? Math.round(Number(row.weight_lifted)) : null,
        row.score?.trim() ?? null,
      ),
    );
  }
  return keys;
}

export async function commitAthleteImport(
  contactId: string,
  rows: PreparedImportRow[],
): Promise<CommitImportResult> {
  const result: CommitImportResult = {
    inserted: 0,
    skipped: 0,
    duplicates: 0,
    errors: [],
  };

  const importable = rows.filter(
    (r) =>
      r.kind !== "skip" &&
      r.date &&
      (r.kind === "workout" || (r.benchmarkTypeId && r.benchmarkDefinitionId)),
  );

  if (!importable.length) {
    result.skipped = rows.length;
    return result;
  }

  let existingKeys: Set<ExistingPerfKey>;
  try {
    existingKeys = await fetchExistingKeys(contactId);
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : "Couldn't load existing history");
    return result;
  }

  const definitionIds = new Set<string>();
  const payloads: {
    contact_id: string;
    performance_date: string;
    benchmark_type_id: string | null;
    benchmark_definition_id: string | null;
    weight_lifted: number | null;
    result_value: number | null;
    reps_prescribed: number | null;
    score: string | null;
    score_meta: { source: "import"; label: string; kind: "lift" | "workout" };
    workout_scale: PreparedImportRow["workoutScale"];
    status: string;
    is_pr: boolean;
  }[] = [];

  for (const row of importable) {
    const key = perfKey(
      row.date!,
      row.benchmarkDefinitionId,
      row.weightLb != null ? Math.round(row.weightLb) : null,
      row.score,
    );
    if (existingKeys.has(key)) {
      result.duplicates++;
      continue;
    }

    if (row.kind === "lift") {
      const label = row.movementLabel?.trim() || "Strength lift";
      payloads.push({
        contact_id: contactId,
        performance_date: row.date!,
        benchmark_type_id: row.benchmarkTypeId,
        benchmark_definition_id: row.benchmarkDefinitionId,
        weight_lifted: Math.round(row.weightLb!),
        result_value: Math.round(row.weightLb!),
        reps_prescribed: row.repCount,
        score: null,
        score_meta: { source: "import", label, kind: "lift" },
        workout_scale: row.workoutScale,
        status: "completed",
        is_pr: false,
      });
      if (row.benchmarkDefinitionId) definitionIds.add(row.benchmarkDefinitionId);
      existingKeys.add(key);
    } else {
      const label = row.workoutName?.trim() || row.movementLabel?.trim() || "Workout";
      payloads.push({
        contact_id: contactId,
        performance_date: row.date!,
        benchmark_type_id: row.benchmarkTypeId,
        benchmark_definition_id: null,
        weight_lifted: null,
        result_value: null,
        reps_prescribed: null,
        score: row.score,
        score_meta: { source: "import", label, kind: "workout" },
        workout_scale: row.workoutScale,
        status: "completed",
        is_pr: false,
      });
      existingKeys.add(key);
    }
  }

  result.skipped = rows.length - importable.length;

  if (!payloads.length) return result;

  const BATCH = 50;
  for (let i = 0; i < payloads.length; i += BATCH) {
    const chunk = payloads.slice(i, i + BATCH);
    const { error } = await supabase.from("athlete_performance").insert(chunk);
    if (error) {
      result.errors.push(formatSupabaseError(error.message));
      break;
    }
    result.inserted += chunk.length;
  }

  for (const defId of definitionIds) {
    const { error } = await recomputeBenchmarkSummary(contactId, defId);
    if (error) result.errors.push(error);
  }

  return result;
}
