import type { Persona } from "@/contexts/AuthContext";

export const STAFF_PERSONAS: Persona[] = ["coach", "programmer", "admin"];

/** Normalize legacy / DB role strings onto UI persona keys. */
export function normalizeMembershipRole(role: string): string {
  if (role === "head_coach") return "programmer";
  return role;
}

/**
 * UI personas from fitness_membership roles at the active gym.
 * Matches Lovable behavior (staff nav from FM roles). RLS still enforces subscriptions on writes.
 */
export function resolveAvailablePersonas(roles: string[]): Persona[] {
  const roleSet = new Set(roles.map(normalizeMembershipRole));
  const personas: Persona[] = [];

  if (roleSet.has("athlete")) personas.push("athlete");
  if (roleSet.has("coach")) personas.push("coach");
  if (roleSet.has("programmer")) personas.push("programmer");
  if (roleSet.has("admin") || roleSet.has("owner")) personas.push("admin");

  return personas.length ? personas : ["athlete"];
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

export function staffPersonasFromRoles(roles: string[]): Persona[] {
  return resolveAvailablePersonas(roles).filter((p) => STAFF_PERSONAS.includes(p));
}
