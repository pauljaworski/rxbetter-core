import { Outlet, Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RxSidebar } from "./RxSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";
import { PersonaSwitcher } from "./PersonaSwitcher";
import { BottomNav } from "./BottomNav";
import { OverflowMenu } from "./OverflowMenu";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/": "Today",
  "/calendar": "Calendar",
  "/insights": "Smart Insights",
  "/prs": "PR Vault",
  "/history": "History",
  "/staff": "Staff",
  "/staff/programming": "Programming",
  "/staff/classes": "Class Day",
  "/staff/roster": "Roster",
  "/staff/memberships": "Memberships",
};

export function AppShell() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "RxBetter";
  const { displayName, memberships, activeGymId, setActiveGym, signOut, activePersona } = useAuth();
  const activeGym = memberships.find((m) => m.gym_id === activeGymId);
  const isAthlete = activePersona === "athlete";
  const insightsActive = pathname === "/insights";
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {!isAthlete && <RxSidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl">
            {isAthlete && <OverflowMenu />}
            {!isAthlete && (
              <>
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <div className="h-4 w-px bg-border" />
              </>
            )}
            {isAthlete && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Smart Insights"
                className={cn(
                  "relative text-muted-foreground hover:text-foreground",
                  insightsActive && "text-primary",
                )}
              >
                <Link to="/insights">
                  <Sparkles className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 rounded-sm bg-primary/15 px-1 text-[8px] font-bold leading-3 text-primary">
                    AI
                  </span>
                </Link>
              </Button>
            )}
            <span className="text-sm font-semibold tracking-tight">{title}</span>
            <div className="ml-3 hidden md:block">
              <PersonaSwitcher />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="md:hidden">
                <PersonaSwitcher compact />
              </div>
              {memberships.length > 1 ? (
                <select
                  value={activeGymId ?? ""}
                  onChange={(e) => void setActiveGym(e.target.value)}
                  className="rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-foreground"
                  aria-label="Active gym"
                >
                  {memberships.map((m) => (
                    <option key={m.gym_id} value={m.gym_id}>
                      {m.gym_name ?? "Gym"}
                    </option>
                  ))}
                </select>
              ) : activeGym ? (
                <span className="hidden rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-semibold text-muted-foreground sm:inline">
                  {activeGym.gym_name}
                </span>
              ) : null}
              {displayName && (
                <span className="hidden text-xs text-muted-foreground sm:inline">{displayName}</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void signOut()}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main
            className={cn(
              "mx-auto w-full max-w-6xl flex-1 px-4 pt-6",
              isAthlete ? "pb-28" : "pb-12",
            )}
          >
            <Outlet />
          </main>
          {isAthlete && <BottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}