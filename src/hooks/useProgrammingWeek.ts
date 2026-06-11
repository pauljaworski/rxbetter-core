import { useCallback } from "react";
import { addDays, format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "./useAsyncState";
import type { LogLineItem, ExistingPerformance } from "@/components/rx/LogScoreSheet";
import {
  fetchAthleteTrackLibraryIds,
  isProgrammingVisibleForTracks,
  loadAssignmentMap,
} from "@/lib/programming/athlete-library-filter";
import { enrichLogLineItems } from "@/lib/programming/enrich-line-items";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

export type WeekWod = {
  id: string;
  name: string | null;
  description: string | null;
  athlete_notes: string | null;
  coaches_notes: string | null;
  programming_segment: string | null;
  metcon_format: string | null;
  workout_scheme?: unknown;
  segment_group_id?: string | null;
  group_score_anchor?: boolean;
  display_order: number | null;
  wod_date: string;
  prescribed_scale?: string | null;
  program_library_id?: string | null;
  published_at?: string | null;
};

export type GymAthlete = { id: string; name: string };

export type ProgrammingWeekData = {
  wods: WeekWod[];
  itemsByWod: Map<string, LogLineItem[]>;
  perfByItem: Map<string, ExistingPerformance>;
  perfBySegment: Map<string, SegmentPerformance>;
  perfByGroup: Map<string, SegmentPerformance>;
  athletes: GymAthlete[];
};

const EMPTY: ProgrammingWeekData = {
  wods: [],
  itemsByWod: new Map(),
  perfByItem: new Map(),
  perfBySegment: new Map(),
  perfByGroup: new Map(),
  athletes: [],
};

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function useProgrammingWeek(
  activeGymId: string | null,
  contactId: string | null,
  weekStart: Date,
) {
  const loader = useCallback(async (): Promise<ProgrammingWeekData> => {
    if (!activeGymId) return EMPTY;

    const start = dayKey(weekStart);
    const end = dayKey(addDays(weekStart, 6));

    const trackIds =
      contactId != null ? await fetchAthleteTrackLibraryIds(contactId, activeGymId) : [];

    const { data: progs, error: progErr } = await supabase
      .from("programming")
      .select(
        "id, name, description, athlete_notes, coaches_notes, programming_segment, metcon_format, workout_scheme, segment_group_id, group_score_anchor, display_order, wod_date, prescribed_scale, program_library_id, published_at",
      )
      .eq("gym_id", activeGymId)
      .eq("source", "gym")
      .gte("wod_date", start)
      .lte("wod_date", end)
      .order("wod_date", { ascending: true })
      .order("display_order", { ascending: true });

    if (progErr) throw new Error(progErr.message);

    const raw = (progs ?? []) as WeekWod[];
    const assignmentMap = await loadAssignmentMap(raw.map((p) => p.id));
    const wods = raw.filter(
      (p) =>
        p.published_at != null &&
        isProgrammingVisibleForTracks(p, assignmentMap, trackIds),
    ) as WeekWod[];
    const progIds = wods.map((p) => p.id);

    const itemsByWod = new Map<string, LogLineItem[]>();
    const perfByItem = new Map<string, ExistingPerformance>();
    const perfBySegment = new Map<string, SegmentPerformance>();
    const perfByGroup = new Map<string, SegmentPerformance>();
    const groupIds = Array.from(
      new Set(wods.map((w) => w.segment_group_id).filter(Boolean) as string[]),
    );

    if (progIds.length) {
      const { data: items, error: itemErr } = await supabase
        .from("programming_line_item")
        .select(
          "id, programming_id, sequence_number, reps_prescribed, prescribed_percentage, prescribed_weight, prescribed_score, status, benchmark_definition_id, benchmark_type_id, contact_id, movement_label",
        )
        .in("programming_id", progIds)
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

      const rawByWod = new Map<string, LogLineItem[]>();
      for (const it of items ?? []) {
        const t = it.benchmark_type_id ? typeMap.get(it.benchmark_type_id) : undefined;
        const row: LogLineItem = {
          id: it.id,
          sequence_number: it.sequence_number,
          reps_prescribed: it.reps_prescribed,
          prescribed_percentage: it.prescribed_percentage,
          prescribed_weight: it.prescribed_weight,
          prescribed_score: it.prescribed_score,
          status: it.status,
          benchmark_definition_id: it.benchmark_definition_id,
          benchmark_type_id: it.benchmark_type_id,
          bench_name: t?.name ?? it.movement_label ?? undefined,
          stimulus: t?.stimulus ?? undefined,
        };
        const arr = rawByWod.get(it.programming_id) ?? [];
        arr.push(row);
        rawByWod.set(it.programming_id, arr);
      }
      for (const [progId, rows] of rawByWod) {
        itemsByWod.set(progId, await enrichLogLineItems(rows));
      }

      if (contactId && (progIds.length || groupIds.length)) {
        let perfQuery = supabase
          .from("athlete_performance")
          .select(
            "id, programming_id, programming_line_item_id, segment_group_id, score, weight_lifted, rpe, is_pr, workout_scale, status, result_value",
          )
          .eq("contact_id", contactId);
        if (progIds.length && groupIds.length) {
          perfQuery = perfQuery.or(
            `programming_id.in.(${progIds.join(",")}),segment_group_id.in.(${groupIds.join(",")})`,
          );
        } else if (progIds.length) {
          perfQuery = perfQuery.in("programming_id", progIds);
        } else {
          perfQuery = perfQuery.in("segment_group_id", groupIds);
        }

        const { data: perfs, error: perfErr } = await perfQuery;
        if (perfErr) throw new Error(perfErr.message);
        for (const p of perfs ?? []) {
          if (p.programming_line_item_id) {
            perfByItem.set(p.programming_line_item_id, {
              id: p.id,
              score: p.score,
              weight_lifted: p.weight_lifted,
              rpe: p.rpe,
              is_pr: p.is_pr,
              workout_scale: p.workout_scale,
              status: p.status,
            });
          } else if (p.segment_group_id && p.score != null) {
            perfByGroup.set(p.segment_group_id, {
              id: p.id,
              score: p.score,
              workout_scale: p.workout_scale,
              result_value: p.result_value,
            });
          } else if (p.programming_id && p.score != null) {
            perfBySegment.set(p.programming_id, {
              id: p.id,
              score: p.score,
              workout_scale: p.workout_scale,
              result_value: p.result_value,
            });
          }
        }
      }
    }

    const { data: members, error: memErr } = await supabase
      .from("fitness_membership")
      .select("contact_id")
      .eq("gym_id", activeGymId)
      .eq("membership_status", "active");

    if (memErr) throw new Error(memErr.message);

    const contactIds = Array.from(new Set((members ?? []).map((m) => m.contact_id)));
    const { data: contacts } = contactIds.length
      ? await supabase.from("contact").select("id, first_name, last_name").in("id", contactIds)
      : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };

    const athletes: GymAthlete[] = (contacts ?? []).map((c) => ({
      id: c.id,
      name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Member",
    }));

    return { wods, itemsByWod, perfByItem, perfBySegment, perfByGroup, athletes };
  }, [activeGymId, contactId, weekStart.getTime()]);

  return useAsyncState(loader, [activeGymId, contactId, weekStart.getTime()], EMPTY, (d) => d.wods.length === 0);
}
