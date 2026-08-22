import { useCallback, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import {
  countStaffClassScores,
  partitionStaffClassPerformances,
} from "@/lib/programming/staff-class-day";
import type {
  StaffClassContact,
  StaffClassDayData,
  StaffClassLineItem,
  StaffClassPerformance,
  StaffClassWod,
} from "./types";

const EMPTY: StaffClassDayData = {
  wods: [],
  itemsByWod: new Map(),
  perfByItem: new Map(),
  perfBySegment: new Map(),
  contacts: new Map(),
  totalLogged: 0,
};

export function useStaffClassDay(activeGymId: string | null, date: Date) {
  const dateKey = format(date, "yyyy-MM-dd");

  const loader = useCallback(async (): Promise<StaffClassDayData> => {
    if (!activeGymId) return EMPTY;

    const { data: progs, error: progErr } = await supabase
      .from("programming")
      .select(
        "id, name, description, programming_segment, metcon_format, display_order, athlete_notes, coaches_notes",
      )
      .eq("gym_id", activeGymId)
      .eq("wod_date", dateKey)
      .order("display_order", { ascending: true });

    if (progErr) throw new Error(progErr.message);

    const wods = (progs ?? []) as StaffClassWod[];
    const ids = wods.map((p) => p.id);
    const itemsByWod = new Map<string, StaffClassLineItem[]>();
    const contacts = new Map<string, StaffClassContact>();

    if (!ids.length) {
      return {
        wods,
        itemsByWod,
        perfByItem: new Map(),
        perfBySegment: new Map(),
        contacts,
        totalLogged: 0,
      };
    }

    const { data: items, error: itemErr } = await supabase
      .from("programming_line_item")
      .select(
        "id, programming_id, sequence_number, reps_prescribed, prescribed_weight, prescribed_percentage, prescribed_score, benchmark_type_id",
      )
      .in("programming_id", ids)
      .is("contact_id", null)
      .order("sequence_number", { ascending: true });

    if (itemErr) throw new Error(itemErr.message);

    const typeIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
    );
    const { data: types } = typeIds.length
      ? await supabase.from("benchmark_type").select("id, name").in("id", typeIds)
      : { data: [] as { id: string; name: string }[] };
    const typeMap = new Map((types ?? []).map((t) => [t.id, t.name]));

    for (const it of items ?? []) {
      const enriched: StaffClassLineItem = {
        ...it,
        bench_name: it.benchmark_type_id ? typeMap.get(it.benchmark_type_id) ?? null : null,
      };
      const arr = itemsByWod.get(it.programming_id) ?? [];
      arr.push(enriched);
      itemsByWod.set(it.programming_id, arr);
    }

    const { data: perfs, error: perfErr } = await supabase
      .from("athlete_performance")
      .select(
        "id, contact_id, programming_id, programming_line_item_id, score, weight_lifted, rpe, is_pr, workout_scale, status",
      )
      .in("programming_id", ids);

    if (perfErr) throw new Error(perfErr.message);

    const { perfByItem, perfBySegment } = partitionStaffClassPerformances(
      (perfs ?? []) as StaffClassPerformance[],
    );
    const totalLogged = countStaffClassScores(perfByItem, perfBySegment);

    const contactIds = Array.from(new Set((perfs ?? []).map((p) => p.contact_id)));
    if (contactIds.length) {
      const { data: cs, error: cErr } = await supabase
        .from("contact")
        .select("id, first_name, last_name")
        .in("id", contactIds);
      if (cErr) throw new Error(cErr.message);
      for (const c of cs ?? []) {
        contacts.set(c.id, {
          id: c.id,
          name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Athlete",
        });
      }
    }

    return { wods, itemsByWod, perfByItem, perfBySegment, contacts, totalLogged };
  }, [activeGymId, dateKey]);

  const state = useAsyncState(loader, [activeGymId, dateKey], EMPTY, (d) => d.wods.length === 0);

  const dataWithTotal = useMemo(
    (): StaffClassDayData => ({
      ...state.data,
      totalLogged: countStaffClassScores(state.data.perfByItem, state.data.perfBySegment),
    }),
    [state.data],
  );

  return { ...state, data: dataWithTotal };
}
