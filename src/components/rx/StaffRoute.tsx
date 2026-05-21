import { useEffect, useMemo } from "react";
import { useAuth, type Persona } from "@/contexts/AuthContext";
import { pickStaffPersonaForAllow, staffPersonasFromRoles } from "@/lib/personas";
import { Card } from "@/components/ui/card";

/** Guards a route to one or more staff personas at the active gym. */
export function StaffRoute({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow?: Persona[];
}) {
  const {
    availablePersonas,
    activePersona,
    setActivePersona,
    loading,
    identityReady,
    memberships,
    activeGymId,
  } = useAuth();
  const allowed = useMemo(
    () => allow ?? (["coach", "programmer", "admin"] as Persona[]),
    [allow],
  );

  const activeRoles = memberships.find((m) => m.gym_id === activeGymId)?.roles ?? [];
  const staffFromRoles = staffPersonasFromRoles(activeRoles);
  const hasAccess = staffFromRoles.some((p) => allowed.includes(p));

  const promotedPersona = pickStaffPersonaForAllow(
    [...new Set([...availablePersonas, ...staffFromRoles])],
    allowed,
  );

  const personaForRoute = allowed.includes(activePersona)
    ? activePersona
    : promotedPersona;

  useEffect(() => {
    if (loading || !identityReady || !hasAccess || !promotedPersona) return;
    if (allowed.includes(activePersona)) return;
    setActivePersona(promotedPersona);
  }, [
    loading,
    identityReady,
    hasAccess,
    activePersona,
    promotedPersona,
    allowed,
    setActivePersona,
  ]);

  if (loading || !identityReady) return null;

  if (!hasAccess) {
    return (
      <Card className="glass-card mx-auto mt-12 max-w-md p-8 text-center">
        <p className="eyebrow">Restricted</p>
        <h2 className="mt-2 text-lg font-bold">Staff access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You need a coach, programmer, or admin role at this gym. Switch gyms or ask an admin to
          grant access.
        </p>
      </Card>
    );
  }

  if (!personaForRoute || !allowed.includes(personaForRoute)) {
    return (
      <Card className="glass-card mx-auto mt-12 max-w-md p-8 text-center">
        <p className="eyebrow">Restricted</p>
        <h2 className="mt-2 text-lg font-bold">Wrong workspace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your current role cannot open this page. Use Staff Overview or switch persona.
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}
