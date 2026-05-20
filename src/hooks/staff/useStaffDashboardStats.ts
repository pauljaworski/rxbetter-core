import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import type { StaffDashboardStats } from "./types";

const EMPTY: StaffDashboardStats = {
  members: 0,
  activeSubs: 0,
  scoresLoggedToday: 0,
  upcomingWods: 0,
};

export function useStaffDashboardStats(activeGymId: string | null, today?: string) {
  const dateKey = today ?? new Date().toISOString().slice(0, 10);

  const loader = useCallback(async (): Promise<StaffDashboardStats> => {
    if (!activeGymId) return EMPTY;

    const { data: gymProgs } = await supabase
      .from("programming")
      .select("id")
      .eq("gym_id", activeGymId);
    const progIds = (gymProgs ?? []).map((p) => p.id);

    const [membersRes, subsRes, wodsRes, perfsRes] = await Promise.all([
      supabase
        .from("fitness_membership")
        .select("id", { count: "exact", head: true })
        .eq("gym_id", activeGymId)
        .eq("membership_status", "active")
        .eq("role", "athlete"),
      supabase
        .from("athlete_subscription")
        .select("id", { count: "exact", head: true })
        .eq("gym_id", activeGymId)
        .eq("status", "active"),
      supabase
        .from("programming")
        .select("id", { count: "exact", head: true })
        .eq("gym_id", activeGymId)
        .gte("wod_date", dateKey),
      progIds.length
        ? supabase
            .from("athlete_performance")
            .select("id", { count: "exact", head: true })
            .eq("performance_date", dateKey)
            .in("programming_id", progIds)
        : Promise.resolve({ count: 0, error: null }),
    ]);

    if (membersRes.error) throw new Error(membersRes.error.message);
    if (subsRes.error) throw new Error(subsRes.error.message);
    if (wodsRes.error) throw new Error(wodsRes.error.message);
    if (perfsRes.error) throw new Error(perfsRes.error.message);

    return {
      members: membersRes.count ?? 0,
      activeSubs: subsRes.count ?? 0,
      scoresLoggedToday: perfsRes.count ?? 0,
      upcomingWods: wodsRes.count ?? 0,
    };
  }, [activeGymId, dateKey]);

  return useAsyncState(loader, [activeGymId, dateKey], EMPTY, () => false);
}
