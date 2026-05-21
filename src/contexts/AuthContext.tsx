import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { normalizeMembershipRole, resolveAvailablePersonas } from "@/lib/personas";

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
  mode: IdentityMode;
  activeGymId: string | null;
  memberships: GymMembership[];
  loading: boolean;
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
  const [activeGymId, setActiveGymId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<GymMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePersona, setActivePersonaState] = useState<Persona>("athlete");

  async function hydrate(u: User | null) {
    if (!u) {
      setContactId(null);
      setDisplayName(null);
      setActiveGymId(null);
      setMemberships([]);
      return;
    }
    // contact for current user
    const { data: c } = await supabase
      .from("contact")
      .select("id, first_name, last_name")
      .eq("user_id", u.id)
      .maybeSingle();
    const cid = c?.id ?? null;
    setContactId(cid);
    setDisplayName(
      [c?.first_name, c?.last_name].filter(Boolean).join(" ") || u.email?.split("@")[0] || null,
    );

    // profile (last_active_gym_id)
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_active_gym_id")
      .eq("id", u.id)
      .maybeSingle();

    // memberships
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
        : { data: [] as any[] };
      const nameMap = new Map((gyms ?? []).map((g: any) => [g.id, g.name]));
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
    setActiveGymId(mems.length ? preferred : null);
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    await hydrate(data.session?.user ?? null);
  }

  useEffect(() => {
    // Set listener BEFORE getSession (Lovable auth rule).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Defer DB calls to avoid deadlocking the auth callback.
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

  // Keep activePersona in sync with what's available; default to highest privilege.
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
      mode,
      activeGymId,
      memberships,
      loading,
      availablePersonas,
      activePersona,
      setActivePersona,
      setActiveGym,
      signOut,
      refresh,
    }),
    [session, user, contactId, displayName, mode, activeGymId, memberships, loading, availablePersonas, activePersona],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
