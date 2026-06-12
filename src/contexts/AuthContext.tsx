import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { normalizeMembershipRole, resolveAvailablePersonas } from "@/lib/personas";
import type { RxGender } from "@/lib/programming/rx-variants-schema";
import type { WorkoutScale } from "@/lib/format";
import type { WeightUnit } from "@/lib/weight-unit";

export type Persona = "athlete" | "coach" | "programmer" | "admin";
export const PERSONA_ORDER: Persona[] = ["athlete", "coach", "programmer", "admin"];

type GymMembership = {
  gym_id: string;
  gym_name: string | null;
  roles: string[];
};

export type IdentityMode = "personal" | "gym";

type AuthState = {
  session: Session | null;
  user: User | null;
  contactId: string | null;
  displayName: string | null;
  profileDisplayName: string | null;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  rxGender: RxGender | null;
  setRxGender: (gender: RxGender | null) => void;
  defaultWorkoutScale: WorkoutScale | null;
  weightUnit: WeightUnit;
  timezone: string | null;
  mode: IdentityMode;
  activeGymId: string | null;
  memberships: GymMembership[];
  loading: boolean;
  identityReady: boolean;
  availablePersonas: Persona[];
  activePersona: Persona;
  setActivePersona: (p: Persona) => void;
  setActiveGym: (gymId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [rxGender, setRxGender] = useState<RxGender | null>(null);
  const [defaultWorkoutScale, setDefaultWorkoutScale] = useState<WorkoutScale | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [timezone, setTimezone] = useState<string | null>(null);
  const [activeGymId, setActiveGymId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<GymMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityReady, setIdentityReady] = useState(false);
  const [activePersona, setActivePersonaState] = useState<Persona>("athlete");

  function clearIdentity() {
    setContactId(null);
    setDisplayName(null);
    setProfileDisplayName(null);
    setEmail(null);
    setPhone(null);
    setFirstName(null);
    setLastName(null);
    setAvatarUrl(null);
    setRxGender(null);
    setDefaultWorkoutScale(null);
    setWeightUnit("lb");
    setTimezone(null);
    setActiveGymId(null);
    setMemberships([]);
    setIdentityReady(false);
  }

  async function hydrate(u: User | null) {
    if (!u) {
      clearIdentity();
      return;
    }

    const { data: c } = await supabase
      .from("contact")
      .select(
        "id, first_name, last_name, email, phone, rx_gender, avatar_url, default_workout_scale, weight_unit, timezone",
      )
      .eq("user_id", u.id)
      .maybeSingle();
    const cid = c?.id ?? null;
    setContactId(cid);
    setFirstName(c?.first_name ?? null);
    setLastName(c?.last_name ?? null);
    setEmail(c?.email ?? u.email ?? null);
    setPhone(c?.phone ?? null);
    setAvatarUrl(c?.avatar_url ?? null);
    setRxGender(c?.rx_gender === "male" || c?.rx_gender === "female" ? c.rx_gender : null);
    setDefaultWorkoutScale(
      c?.default_workout_scale === "rx_plus" ||
        c?.default_workout_scale === "rx" ||
        c?.default_workout_scale === "fx" ||
        c?.default_workout_scale === "scaled"
        ? c.default_workout_scale
        : null,
    );
    setWeightUnit(c?.weight_unit === "kg" ? "kg" : "lb");
    setTimezone(c?.timezone ?? null);

    const { data: profile } = await supabase
      .from("profiles")
      .select("last_active_gym_id, display_name")
      .eq("id", u.id)
      .maybeSingle();

    const legalName = [c?.first_name, c?.last_name].filter(Boolean).join(" ");
    const disp = profile?.display_name?.trim() || legalName || u.email?.split("@")[0] || null;
    setProfileDisplayName(profile?.display_name ?? null);
    setDisplayName(disp);

    let mems: GymMembership[] = [];
    if (cid) {
      const { data: fm } = await supabase
        .from("fitness_membership")
        .select("gym_id, role")
        .eq("contact_id", cid)
        .eq("membership_status", "active");
      const gymIds = Array.from(new Set((fm ?? []).map((m) => m.gym_id)));
      const { data: gyms } = gymIds.length
        ? await supabase.from("gym").select("id, name").in("id", gymIds)
        : { data: [] as { id: string; name: string }[] };
      const nameMap = new Map((gyms ?? []).map((g) => [g.id, g.name]));
      const rolesByGym = new Map<string, Set<string>>();
      for (const m of fm ?? []) {
        if (!m.role) continue;
        const s = rolesByGym.get(m.gym_id) ?? new Set<string>();
        s.add(normalizeMembershipRole(m.role));
        rolesByGym.set(m.gym_id, s);
      }
      mems = gymIds.map((gid) => ({
        gym_id: gid,
        gym_name: nameMap.get(gid) ?? null,
        roles: Array.from(rolesByGym.get(gid) ?? []),
      }));
    }
    setMemberships(mems);

    const preferred =
      profile?.last_active_gym_id && mems.some((m) => m.gym_id === profile.last_active_gym_id)
        ? profile.last_active_gym_id
        : (mems[0]?.gym_id ?? null);
    setActiveGymId((prev) => {
      const next = mems.length ? preferred : null;
      return prev && next && mems.some((m) => m.gym_id === prev) ? prev : next;
    });
    setIdentityReady(true);
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    await hydrate(data.session?.user ?? null);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setTimeout(() => {
        void hydrate(s?.user ?? null);
      }, 0);
    });
    (async () => {
      await refresh();
      setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function setActiveGym(gymId: string) {
    setActiveGymId(gymId);
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_active_gym_id: gymId, last_active_gym_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const mode: IdentityMode = memberships.length === 0 ? "personal" : "gym";
  const activeMembership = memberships.find((m) => m.gym_id === activeGymId);
  const availablePersonas = useMemo<Persona[]>(() => {
    return resolveAvailablePersonas(activeMembership?.roles ?? []);
  }, [activeMembership?.roles?.join("|")]);

  useEffect(() => {
    if (!availablePersonas.includes(activePersona)) {
      setActivePersonaState(availablePersonas[availablePersonas.length - 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePersonas.join("|")]);

  function setActivePersona(p: Persona) {
    if (availablePersonas.includes(p)) setActivePersonaState(p);
  }

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      contactId,
      displayName,
      profileDisplayName,
      email,
      phone,
      firstName,
      lastName,
      avatarUrl,
      rxGender,
      setRxGender,
      defaultWorkoutScale,
      weightUnit,
      timezone,
      mode,
      activeGymId,
      memberships,
      loading,
      identityReady,
      availablePersonas,
      activePersona,
      setActivePersona,
      setActiveGym,
      signOut,
      refresh,
    }),
    [
      session,
      user,
      contactId,
      displayName,
      profileDisplayName,
      email,
      phone,
      firstName,
      lastName,
      avatarUrl,
      rxGender,
      defaultWorkoutScale,
      weightUnit,
      timezone,
      mode,
      activeGymId,
      memberships,
      loading,
      identityReady,
      availablePersonas,
      activePersona,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}

/** Resolve default logging scale: existing perf → prescribed → profile default → rx. */
export function resolveDefaultWorkoutScale(
  existing: string | null | undefined,
  prescribed: string | null | undefined,
  profileDefault: WorkoutScale | null,
): WorkoutScale {
  const valid = (s: string | null | undefined): s is WorkoutScale =>
    s === "rx_plus" || s === "rx" || s === "fx" || s === "scaled";
  if (valid(existing)) return existing;
  if (valid(prescribed)) return prescribed;
  if (profileDefault) return profileDefault;
  return "rx";
}
