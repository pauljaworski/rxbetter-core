import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffDashboardStats } from "@/hooks/staff/useStaffDashboardStats";
import { StaffStatCard } from "@/components/coach/StaffStatCard";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import {
  CalendarDays,
  ClipboardList,
  Users,
  CreditCard,
  ChevronRight,
  Activity,
  Flame,
} from "lucide-react";
import { format } from "date-fns";

const ALL_TILES = [
  {
    to: "/staff/classes",
    label: "Class Day",
    icon: CalendarDays,
    desc: "Review classes & fix athlete scores",
    personas: ["coach", "programmer", "admin"],
  },
  {
    to: "/staff/programming",
    label: "Programming",
    icon: ClipboardList,
    desc: "Build & schedule WODs from templates",
    personas: ["programmer", "admin"],
  },
  {
    to: "/staff/roster",
    label: "Roster",
    icon: Users,
    desc: "Members, subscriptions, capabilities",
    personas: ["coach", "programmer", "admin"],
  },
  {
    to: "/staff/memberships",
    label: "Memberships",
    icon: CreditCard,
    desc: "Offerings & track links",
    personas: ["admin"],
  },
];

export default function StaffDashboard() {
  const { activeGymId, activePersona, displayName, memberships } = useAuth();
  const activeGym = memberships.find((m) => m.gym_id === activeGymId);
  const { data: stats, isLoading, error } = useStaffDashboardStats(activeGymId);

  const tiles = ALL_TILES.filter(
    (t) => t.personas.includes(activePersona) && t.to !== "/staff/programming",
  );

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-[var(--radius)] border border-border p-6 md:p-8"
        style={{ background: "var(--gradient-hero)" }}
      >
        <p className="eyebrow">{activePersona} workspace</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
          {activeGym?.gym_name ?? "Your gym"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}. {format(new Date(), "EEEE, MMM d")} ·{" "}
          {activePersona === "coach"
            ? "Review today's classes, clean up scores, and update notes."
            : activePersona === "programmer"
              ? "Build out the week. Duplicate yesterday, swap in fresh stimulus."
              : "Everything from athletes to offerings is one tap away."}
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <PageSkeleton rows={2} />
      ) : (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StaffStatCard label="Athletes" value={stats.members} icon={Users} loading={false} />
          <StaffStatCard label="Active Subs" value={stats.activeSubs} icon={CreditCard} loading={false} />
          <StaffStatCard label="Scores today" value={stats.scoresLoggedToday} icon={Flame} loading={false} />
          <StaffStatCard label="Upcoming WODs" value={stats.upcomingWods} icon={Activity} loading={false} />
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="glass-card group flex items-center justify-between gap-3 p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-bold leading-tight">{t.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
