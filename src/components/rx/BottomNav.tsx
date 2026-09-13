import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Activity, CalendarDays, Flame, History, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const items = [
  { to: "/", label: "Today", icon: Activity, end: true },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function BottomNav() {
  const [progressOpen, setProgressOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const progressActive = pathname === "/prs" || pathname === "/history";

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {items.map((it) => (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={"end" in it ? it.end : false}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium leading-tight transition-colors sm:text-[11px]",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <it.icon className="h-5 w-5" />
                <span className="text-center">{it.label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium leading-tight transition-colors sm:text-[11px]",
                progressActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Flame className="h-5 w-5" />
              <span className="text-center">PRs / History</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={progressOpen} onOpenChange={setProgressOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>PRs &amp; History</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-left transition-colors hover:bg-secondary"
              onClick={() => {
                setProgressOpen(false);
                nav("/prs");
              }}
            >
              <Flame className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">PR Vault</p>
                <p className="text-xs text-muted-foreground">Current PRs and progress</p>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-left transition-colors hover:bg-secondary"
              onClick={() => {
                setProgressOpen(false);
                nav("/history");
              }}
            >
              <History className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">History</p>
                <p className="text-xs text-muted-foreground">Past scores and lifts</p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
