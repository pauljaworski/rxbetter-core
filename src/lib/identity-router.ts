import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../types/database";

export type IdentityMode = "personal" | "gym";

/** One gym the user belongs to (may have multiple roles = multiple FM rows). */
export type GymSwitcherRow = {
  gymId: string;
  gymName: string;
  roles: string[];
};

export type IdentityResolution =
  | {
      mode: "personal";
      defaultGymId: null;
    }
  | {
      mode: "gym";
      defaultGymId: string;
      gymSwitcher: GymSwitcherRow[];
    };

export type IdentityContext =
  | { signedIn: false }
  | {
      signedIn: true;
      userId: string;
      contactId: string;
      profile: Tables<"profiles">;
      resolution: IdentityResolution;
      /** Same gyms as `resolution.gymSwitcher` when mode is `gym`; empty when `personal`. */
      gymSwitcher: GymSwitcherRow[];
      /** Same set as `public.user_gym_ids()` for the session; use for data queries. */
      userGymIds: string[];
    };

export type FitnessMembershipInput = Pick<
  Tables<"fitness_membership">,
  "gym_id" | "role" | "membership_status" | "join_date" | "created_at" | "updated_at"
>;

/**
 * Pure routing: Personal mode when there are no active memberships.
 * Gym mode default: `lastActiveGymId` if it matches an active gym, otherwise the gym
 * with the latest `fitness_membership.updated_at` (tie-break `created_at`).
 */
export function resolveIdentityFromMemberships(
  activeMemberships: FitnessMembershipInput[],
  lastActiveGymId: string | null
): IdentityResolution {
  const active = activeMemberships.filter((m) => m.membership_status === "active");
  if (active.length === 0) {
    return { mode: "personal", defaultGymId: null };
  }

  const byGym = new Map<
    string,
    { roles: Set<string>; sortIso: string }
  >();

  for (const m of active) {
    const cur = byGym.get(m.gym_id);
    const iso = pickSortIso(m);
    if (!cur) {
      byGym.set(m.gym_id, { roles: new Set([m.role]), sortIso: iso });
    } else {
      cur.roles.add(m.role);
      if (iso > cur.sortIso) cur.sortIso = iso;
    }
  }

  const gymIds = [...byGym.keys()];
  const defaultFromLast =
    lastActiveGymId && gymIds.includes(lastActiveGymId) ? lastActiveGymId : null;

  const sortedGymIds = gymIds.sort((a, b) => {
    const ta = byGym.get(a)!.sortIso;
    const tb = byGym.get(b)!.sortIso;
    return tb.localeCompare(ta);
  });

  const defaultGymId = defaultFromLast ?? sortedGymIds[0]!;

  const gymSwitcher: GymSwitcherRow[] = sortedGymIds.map((gymId) => ({
    gymId,
    gymName: "",
    roles: [...byGym.get(gymId)!.roles].sort(),
  }));

  return {
    mode: "gym",
    defaultGymId,
    gymSwitcher,
  };
}

function pickSortIso(m: FitnessMembershipInput): string {
  const u = m.updated_at ?? m.created_at;
  return u;
}

/**
 * Loads profile, active memberships for the current contact, and `user_gym_ids()`.
 * Fills `gymSwitcher[].gymName` from `gym`. No session → `{ signedIn: false }`.
 */
export async function loadIdentityContext(
  supabase: SupabaseClient<Database>
): Promise<IdentityContext> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session?.user) {
    return { signedIn: false };
  }

  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(
      profileError?.message ?? "loadIdentityContext: profile row missing for user"
    );
  }

  const { data: gymIdsRaw, error: rpcError } = await supabase.rpc("user_gym_ids");
  if (rpcError) {
    throw new Error(rpcError.message);
  }
  const userGymIds = gymIdsRaw ?? [];

  const { data: membershipRows, error: fmError } = await supabase
    .from("fitness_membership")
    .select("gym_id, role, membership_status, join_date, created_at, updated_at")
    .eq("contact_id", profile.contact_id)
    .eq("membership_status", "active");

  if (fmError) {
    throw new Error(fmError.message);
  }

  const resolutionBase = resolveIdentityFromMemberships(
    membershipRows ?? [],
    profile.last_active_gym_id
  );

  if (resolutionBase.mode === "personal") {
    return {
      signedIn: true,
      userId,
      contactId: profile.contact_id,
      profile,
      resolution: resolutionBase,
      gymSwitcher: [],
      userGymIds,
    };
  }

  const ids = resolutionBase.gymSwitcher.map((g) => g.gymId);
  const { data: gyms, error: gymError } = await supabase
    .from("gym")
    .select("id, name")
    .in("id", ids);

  if (gymError) {
    throw new Error(gymError.message);
  }

  const nameById = new Map((gyms ?? []).map((g) => [g.id, g.name] as const));
  const gymSwitcher: GymSwitcherRow[] = resolutionBase.gymSwitcher.map((row) => ({
    ...row,
    gymName: nameById.get(row.gymId) ?? row.gymId,
  }));

  const resolution: IdentityResolution = {
    mode: "gym",
    defaultGymId: resolutionBase.defaultGymId,
    gymSwitcher,
  };

  return {
    signedIn: true,
    userId,
    contactId: profile.contact_id,
    profile,
    resolution,
    gymSwitcher,
    userGymIds,
  };
}

/**
 * Persists the user's chosen gym for the Gym Switcher. Call after navigation or switch.
 * Caller should pass a `gymId` the user is a member of (active `fitness_membership`).
 */
export async function setLastActiveGym(
  supabase: SupabaseClient<Database>,
  gymId: string
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user?.id;
  if (!uid) {
    throw new Error("setLastActiveGym: not signed in");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ last_active_gym_id: gymId, last_active_gym_at: now })
    .eq("id", uid);

  if (error) {
    throw new Error(error.message);
  }
}
