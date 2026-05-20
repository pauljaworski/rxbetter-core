import { Navigate } from "react-router-dom";
import { useAuth, type Persona } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

/** Guards a route to one or more staff personas at the active gym. */
export function StaffRoute({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow?: Persona[]; // defaults to any staff persona
}) {
  const { availablePersonas, activePersona } = useAuth();
  const allowed = allow ?? (["coach", "programmer", "admin"] as Persona[]);
  const hasAccess = availablePersonas.some((p) => allowed.includes(p));

  if (!hasAccess) {
    return (
      <Card className="glass-card mx-auto mt-12 max-w-md p-8 text-center">
        <p className="eyebrow">Restricted</p>
        <h2 className="mt-2 text-lg font-bold">Staff access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have a {allowed.join(" / ")} role at this gym. Switch gyms or ask an admin to grant
          access.
        </p>
      </Card>
    );
  }

  if (!allowed.includes(activePersona)) {
    return <Navigate to="/staff" replace />;
  }

  return <>{children}</>;
}