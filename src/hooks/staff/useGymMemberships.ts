import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import type { GymOffering, GymTrackLink } from "./types";

export type GymMembershipsData = {
  offerings: GymOffering[];
  links: GymTrackLink[];
};

const EMPTY: GymMembershipsData = { offerings: [], links: [] };

export function useGymMemberships(activeGymId: string | null) {
  const loader = useCallback(async (): Promise<GymMembershipsData> => {
    if (!activeGymId) return EMPTY;

    const { data: offs, error: offErr } = await supabase
      .from("membership_offering")
      .select("id, name, description, is_active")
      .eq("gym_id", activeGymId)
      .order("name");

    if (offErr) throw new Error(offErr.message);

    const offIds = (offs ?? []).map((o) => o.id);
    const { data: terms, error: termErr } = offIds.length
      ? await supabase
          .from("membership_offering_term")
          .select("id, membership_offering_id, term_months, price_cents, currency")
          .in("membership_offering_id", offIds)
      : { data: [], error: null };

    if (termErr) throw new Error(termErr.message);

    const offerings: GymOffering[] = (offs ?? []).map((o) => ({
      ...o,
      terms: (terms ?? [])
        .filter((t) => t.membership_offering_id === o.id)
        .map((t) => ({
          id: t.id,
          term_months: t.term_months,
          price_cents: t.price_cents,
          currency: t.currency,
        })),
    }));

    const { data: ls, error: linkErr } = await supabase
      .from("fitness_track_link")
      .select("id, label, expires_at, revoked_at, max_redemptions, redemption_count")
      .eq("gym_id", activeGymId)
      .order("created_at", { ascending: false });

    if (linkErr) throw new Error(linkErr.message);

    const linkIds = (ls ?? []).map((l) => l.id);
    const { data: opts, error: optErr } = linkIds.length
      ? await supabase.from("fitness_track_link_option").select("link_id").in("link_id", linkIds)
      : { data: [], error: null };

    if (optErr) throw new Error(optErr.message);

    const optCount = new Map<string, number>();
    for (const o of opts ?? []) {
      optCount.set(o.link_id, (optCount.get(o.link_id) ?? 0) + 1);
    }

    const links: GymTrackLink[] = (ls ?? []).map((l) => ({
      ...l,
      options: optCount.get(l.id) ?? 0,
    }));

    return { offerings, links };
  }, [activeGymId]);

  return useAsyncState(loader, [activeGymId], EMPTY, (d) => d.offerings.length === 0 && d.links.length === 0);
}
