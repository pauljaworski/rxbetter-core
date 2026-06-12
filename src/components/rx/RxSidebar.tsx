import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  Sparkles,
  Flame,
  History as HistoryIcon,
  Trophy,
  User,
  BarChart3,
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  Megaphone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = { to: string; label: string; icon: any; end?: boolean };

const athleteTrain: NavItem[] = [
  { to: "/", label: "Today", icon: Activity, end: true },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/insights", label: "Smart Insights", icon: Sparkles },
];
const athletePerf: NavItem[] = [
  { to: "/prs", label: "PR Vault", icon: Flame },
  { to: "/history", label: "History", icon: HistoryIcon },
  { to: "/profile", label: "Profile", icon: User },
];

const staffCore: NavItem[] = [
  { to: "/staff", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/staff/classes", label: "Class Day", icon: CalendarDays },
];

export function RxSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { displayName, memberships, activeGymId, activePersona } = useAuth();
  const activeGym = memberships.find((m) => m.gym_id === activeGymId);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    );

  const isStaff = activePersona !== "athlete";

  // Build staff menu by persona
  const staffMenu: NavItem[] = [...staffCore];
  if (activePersona === "programmer" || activePersona === "admin") {
    staffMenu.push({ to: "/staff/programming", label: "Programming", icon: ClipboardList });
  }
  staffMenu.push({ to: "/staff/roster", label: "Roster", icon: Users });
  if (activePersona === "admin") {
    staffMenu.push({ to: "/staff/memberships", label: "Memberships", icon: CreditCard });
  }

  const perfActive = athletePerf.some((p) => pathname.startsWith(p.to));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[11px] font-black">RX</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">RxBetter</span>
              <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {activeGym?.gym_name ?? displayName ?? "Athlete"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isStaff ? (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Megaphone className="mr-1 inline h-3 w-3" />
              {activePersona === "coach" ? "Coach" : activePersona === "programmer" ? "Programmer" : "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {staffMenu.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.to} end={item.end} className={linkClass}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Train</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {athleteTrain.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.to} end={item.end} className={linkClass}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className={cn(perfActive && "text-primary")}>
                <BarChart3 className="mr-1 inline h-3 w-3" />
                Performance
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {athletePerf.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.to} className={linkClass}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
