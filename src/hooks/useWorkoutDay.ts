import { useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "./useAsyncState";
import type { Tables } from "@/types/database";
import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import {
  fetchAthleteTrackLibraryIds,
  isProgrammingVisibleForTracks,
  loadAssignmentMap,
} from "@/lib/programming/athlete-library-filter";
import { enrichLogLineItems } from "@/lib/programming/enrich-line-items";
import {
  formatComplexMovementTitle,
  parseMovementComponents,
} from "@/lib/programming/movement-components-schema";

export type WorkoutLineItem = LogLineItem & { programming_id: string; contact_id: string | null };

export type SegmentPerformance = Pick<
  Tables<"athlete_performance">,
  "id" | "score" | "workout_scale" | "result_value"
>;

export type WorkoutDayProgramming = {
  id: string;
  name: string | null;
  description: string | null;
  athlete_notes: string | null;
  coaches_notes: string | null;
  programming_segment: string | null;
  metcon_format: string | null;
  workout_scheme: unknown;
  segment_group_id: string | null;
  group_score_anchor: boolean;
  display_order: number | null;
  wod_date: string;
  prescribed_scale: string | null;
  items: WorkoutLineItem[];
};

export type WorkoutPerformance = Pick<
  Tables<"athlete_performance">,
  "id" | "programming_line_item_id" | "score" | "weight_lifted" | "rpe" | "is_pr" | "workout_scale" | "status" | "result_value"
>;

export type WorkoutDayResult = {
  wodDate: string | null;
  wods: WorkoutDayProgramming[];
  perfByItem: Map<string, WorkoutPerformance>;
  perfBySegment: Map<string, SegmentPerformance>;
  perfByGroup: Map<string, SegmentPerformance>;
};

const EMPTY: WorkoutDayResult = {
  wodDate: null,
  wods: [],
  perfByItem: new Map(),
  perfBySegment: new Map(),
  perfByGroup: new Map(),
};

export function useWorkoutDay(activeGymId: string | null, contactId: string | null) {
  const loader = useCallback(async (): Promise<WorkoutDayResult> => {
    if (!activeGymId) return EMPTY;

    const todayKey = format(new Date(), "yyyy-MM-dd");
    const trackIds =
      contactId != null ? await fetchAthleteTrackLibraryIds(contactId, activeGymId) : [];

    const { data: dayProgs, error: progErr } = await supabase
      .from("programming")
      .select(
        "id, name, description, athlete_notes, coaches_notes, programming_segment, metcon_format, workout_scheme, segment_group_id, group_score_anchor, display_order, wod_date, prescribed_scale, program_library_id, published_at",
      )
      .eq("gym_id", activeGymId)
      .eq("source", "gym")
      .eq("wod_date", todayKey)
      .order("display_order", { ascending: true });

    if (progErr) throw new Error(progErr.message);

    const raw = dayProgs ?? [];
    const assignmentMap = await loadAssignmentMap(raw.map((p) => p.id));
    const progs = raw.filter(
      (p) =>
        p.published_at != null &&
        isProgrammingVisibleForTracks(p, assignmentMap, trackIds),
    );
    if (!progs.length) {
      return {
        wodDate: todayKey,
        wods: [],
        perfByItem: new Map(),
        perfBySegment: new Map(),
        perfByGroup: new Map(),
      };
    }

    const ids = progs.map((p) => p.id);

    const { data: items, error: itemErr } = await supabase
      .from("programming_line_item")
      .select(
        "id, programming_id, sequence_number, reps_prescribed, prescribed_percentage, prescribed_weight, prescribed_score, status, benchmark_definition_id, benchmark_type_id, contact_id, movement_label, line_item_kind, movement_components",
      )
      .in("programming_id", ids)
      .is("contact_id", null)
      .order("sequence_number", { ascending: true });

    if (itemErr) throw new Error(itemErr.message);

    const typeIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
    );
    const { data: types } = typeIds.length
      ? await supabase.from("benchmark_type").select("id, name, stimulus").in("id", typeIds)
      : { data: [] as { id: string; name: string; stimulus: string | null }[] };
    const typeMap = new Map((types ?? []).map((t) => [t.id, t]));

    const wods: WorkoutDayProgramming[] = [];
    for (const p of progs) {
      const rawItems = (items ?? [])
        .filter((i) => i.programming_id === p.id)
        .map((i) => {
          const t = i.benchmark_type_id ? typeMap.get(i.benchmark_type_id) : undefined;
          const components = parseMovementComponents(i.movement_components);
          const complexTitle =
            components.length > 0 ? formatComplexMovementTitle(components) : null;
          return {
            ...i,
            bench_name: complexTitle ?? t?.name ?? i.movement_label ?? undefined,
            stimulus: t?.stimulus ?? undefined,
            line_item_kind: i.line_item_kind,
            movement_components: i.movement_components,
          } as WorkoutLineItem;
        });
      const enriched = (await enrichLogLineItems(rawItems)) as WorkoutLineItem[];
      wods.push({
        ...p,
        group_score_anchor: p.group_score_anchor ?? false,
        items: enriched,
      });
    }

    const perfByItem = new Map<string, WorkoutPerformance>();
    const perfBySegment = new Map<string, SegmentPerformance>();
    const perfByGroup = new Map<string, SegmentPerformance>();
    const groupIds = Array.from(
      new Set(progs.map((p) => p.segment_group_id).filter(Boolean) as string[]),
    );

    if (contactId && (ids.length || groupIds.length)) {
      let perfQuery = supabase
        .from("athlete_performance")
        .select(
          "id, programming_id, programming_line_item_id, segment_group_id, score, weight_lifted, rpe, is_pr, workout_scale, status, result_value",
        )
        .eq("contact_id", contactId);

      if (ids.length && groupIds.length) {
        perfQuery = perfQuery.or(
          `programming_id.in.(${ids.join(",")}),segment_group_id.in.(${groupIds.join(",")})`,
        );
      } else if (ids.length) {
        perfQuery = perfQuery.in("programming_id", ids);
      } else {
        perfQuery = perfQuery.in("segment_group_id", groupIds);
      }

      const { data: perfs, error: perfErr } = await perfQuery;
      if (perfErr) throw new Error(perfErr.message);
      for (const perf of perfs ?? []) {
        if (perf.programming_line_item_id) {
          perfByItem.set(perf.programming_line_item_id, perf);
        } else if (perf.segment_group_id && perf.score != null) {
          perfByGroup.set(perf.segment_group_id, {
            id: perf.id,
            score: perf.score,
            workout_scale: perf.workout_scale,
            result_value: perf.result_value,
          });
        } else if (perf.programming_id && perf.score != null) {
          perfBySegment.set(perf.programming_id, {
            id: perf.id,
            score: perf.score,
            workout_scale: perf.workout_scale,
            result_value: perf.result_value,
          });
        }
      }
    }

    return { wodDate: todayKey, wods, perfByItem, perfBySegment, perfByGroup };
  }, [activeGymId, contactId]);

  return useAsyncState(loader, [activeGymId, contactId], EMPTY, (d) => !d.wodDate || d.wods.length === 0);
}
