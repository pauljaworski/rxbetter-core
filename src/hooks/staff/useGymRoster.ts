import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import type { GymRosterMember } from "./types";

export function useGymRoster(activeGymId: string | null) {
  const loader = useCallback(async (): Promise<GymRosterMember[]> => {
    if (!activeGymId) return [];

    const { data: fm, error: fmErr } = await supabase
      .from("fitness_membership")
      .select("contact_id, role")
      .eq("gym_id", activeGymId)
      .eq("membership_status", "active");

    if (fmErr) throw new Error(fmErr.message);

    const byContact = new Map<string, Set<string>>();
    for (const m of fm ?? []) {
      const s = byContact.get(m.contact_id) ?? new Set<string>();
      if (m.role) s.add(m.role);
      byContact.set(m.contact_id, s);
    }

    const contactIds = Array.from(byContact.keys());
    const [contactsRes, subsRes] = await Promise.all([
      contactIds.length
        ? supabase.from("contact").select("id, first_name, last_name, email").in("id", contactIds)
        : Promise.resolve({ data: [] as { id: string; first_name: string | null; last_name: string | null; email: string | null }[], error: null }),
      supabase
        .from("athlete_subscription")
        .select("contact_id")
        .eq("gym_id", activeGymId)
        .eq("status", "active"),
    ]);

    if (contactsRes.error) throw new Error(contactsRes.error.message);
    if (subsRes.error) throw new Error(subsRes.error.message);

    const subCount = new Map<string, number>();
    for (const s of subsRes.data ?? []) {
      subCount.set(s.contact_id, (subCount.get(s.contact_id) ?? 0) + 1);
    }

    const list: GymRosterMember[] = (contactsRes.data ?? []).map((c) => ({
      contact_id: c.id,
      name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "—",
      email: c.email,
      roles: Array.from(byContact.get(c.id) ?? []),
      subs: subCount.get(c.id) ?? 0,
    }));

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [activeGymId]);

  return useAsyncState(loader, [activeGymId], [] as GymRosterMember[], (d) => d.length === 0);
}
