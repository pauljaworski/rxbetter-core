import type { Persona } from "@/contexts/AuthContext";

export const STAFF_PERSONAS: Persona[] = ["coach", "programmer", "admin"];

const SCOPE_TO_PERSONA: Record<string, Persona> = {
  staff_coach: "coach",
  staff_programmer: "programmer",
  staff_admin: "admin",
};

/** Map FM role + active staff subscription scopes into UI personas (both required for staff). */
export function resolveAvailablePersonas(
  roles: string[],
  staffScopes: string[],
): Persona[] {
  const roleSet = new Set(roles);
  const scopeSet = new Set(staffScopes);
  const personas: Persona[] = [];

  if (roleSet.has("athlete")) personas.push("athlete");

  if (roleSet.has("coach") && scopeSet.has("staff_coach")) personas.push("coach");
  if (roleSet.has("programmer") && scopeSet.has("staff_programmer")) personas.push("programmer");
  if ((roleSet.has("admin") || roleSet.has("owner")) && scopeSet.has("staff_admin")) {
    personas.push("admin");
  }

  return personas.length ? personas : ["athlete"];
}

export function staffScopesFromSubscriptions(
  rows: { gym_id: string; subscription_scope: string }[],
): Map<string, string[]> {
  const byGym = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!SCOPE_TO_PERSONA[row.subscription_scope]) continue;
    const s = byGym.get(row.gym_id) ?? new Set<string>();
    s.add(row.subscription_scope);
    byGym.set(row.gym_id, s);
  }
  return new Map([...byGym.entries()].map(([gymId, scopes]) => [gymId, [...scopes]]));
}

/** Highest staff persona the user may use for a route guard. */
export function pickStaffPersonaForAllow(
  available: Persona[],
  allow: Persona[],
): Persona | null {
  const order: Persona[] = ["admin", "programmer", "coach"];
  for (const p of order) {
    if (allow.includes(p) && available.includes(p)) return p;
  }
  return null;
}

export function hasAnyStaffPersona(available: Persona[]): boolean {
  return available.some((p) => STAFF_PERSONAS.includes(p));
}
