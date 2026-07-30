import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { WorkoutScale } from "@/lib/format";
import { tryMarkProgrammingSegmentComplete } from "@/lib/programming/segment-completion";
import type { Json } from "@/types/database";
import {
  buildSegmentPerformanceUpdate,
  type SegmentPerformanceWriteFields,
} from "@/lib/programming/segment-performance-write";

export type SaveSegmentPerformanceInput = {
  contactId: string;
  programmingId: string;
  wodDate: string;
  existingId?: string;
  score: string;
  resultValue: number | null;
  /** When omitted, existing score_meta is preserved on update. */
  scoreMeta?: Json | null;
  workoutScale: WorkoutScale | null;
  programmingSegment: string | null;
};

export function useSaveSegmentPerformance() {
  const [submitting, setSubmitting] = useState(false);

  async function save(
    input: SaveSegmentPerformanceInput,
  ): Promise<{ error: string | null; id?: string }> {
    setSubmitting(true);
    const fields: SegmentPerformanceWriteFields = {
      score: input.score,
      resultValue: input.resultValue,
      wodDate: input.wodDate,
      workoutScale: input.workoutScale,
    };
    if ("scoreMeta" in input) {
      fields.scoreMeta = input.scoreMeta;
    }

    let id = input.existingId;
    let error: { message: string } | null = null;

    if (input.existingId) {
      const res = await supabase
        .from("athlete_performance")
        .update(buildSegmentPerformanceUpdate(fields))
        .eq("id", input.existingId);
      error = res.error;
    } else {
      const res = await supabase
        .from("athlete_performance")
        .insert({
          ...buildSegmentPerformanceUpdate({
            ...fields,
            // New segment scores start with empty meta unless caller provided one.
            scoreMeta: "scoreMeta" in input ? input.scoreMeta : {},
          }),
          contact_id: input.contactId,
          programming_id: input.programmingId,
          programming_line_item_id: null,
          benchmark_definition_id: null,
          benchmark_type_id: null,
          weight_lifted: null,
        })
        .select("id")
        .single();
      error = res.error;
      id = res.data?.id ?? id;
    }

    if (!error) {
      await tryMarkProgrammingSegmentComplete(
        input.contactId,
        input.programmingId,
        input.wodDate,
        input.programmingSegment,
      );
    }

    setSubmitting(false);
    return { error: error ? formatSupabaseError(error.message) : null, id };
  }

  return { save, submitting };
}
