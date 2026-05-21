import { useAuth, type Persona } from "@/contexts/AuthContext";
import { hasAnyStaffPersona, STAFF_PERSONAS } from "@/lib/personas";
import { cn } from "@/lib/utils";
import { Activity, Megaphone, ClipboardList, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const META: Record<Persona, { label: string; short: string; icon: typeof Activity; color: string }> = {
  athlete: { label: "Athlete", short: "ATH", icon: Activity, color: "text-primary" },
  coach: { label: "Coach", short: "CCH", icon: Megaphone, color: "text-accent" },
  programmer: { label: "Programmer", short: "PRG", icon: ClipboardList, color: "text-primary" },
  admin: { label: "Admin", short: "ADM", icon: ShieldCheck, color: "text-accent" },
};

export function PersonaSwitcher({ compact = false }: { compact?: boolean }) {
  const { availablePersonas, activePersona, setActivePersona } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const isStaffRoute = loc.pathname.startsWith("/staff");
    const isStaffPersona = STAFF_PERSONAS.includes(activePersona);
    const staffAvailable = availablePersonas.filter((p) => STAFF_PERSONAS.includes(p));

    if (isStaffRoute && staffAvailable.length && !isStaffPersona) {
      setActivePersona(staffAvailable[staffAvailable.length - 1]!);
      return;
    }

    if (isStaffPersona && !isStaffRoute) {
      nav("/staff", { replace: true });
      return;
    }

    if (!isStaffPersona && isStaffRoute && !hasAnyStaffPersona(availablePersonas)) {
      nav("/", { replace: true });
    }
  }, [activePersona, loc.pathname, availablePersonas, setActivePersona, nav]);

  if (availablePersonas.length < 2) return null;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-secondary/60 p-0.5">
      {availablePersonas.map((p) => {
        const M = META[p];
        const Icon = M.icon;
        const active = p === activePersona;
        return (
          <button
            key={p}
            type="button"
            onClick={() => setActivePersona(p)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
              active
                ? "bg-background text-foreground shadow-[0_0_0_1px_hsl(var(--border))]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", active && M.color)} />
            {!compact && <span>{M.label}</span>}
            {compact && <span>{M.short}</span>}
          </button>
        );
      })}
    </div>
  );
}
