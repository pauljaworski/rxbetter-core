import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Menu,
  CalendarCheck2,
  CreditCard,
  Settings,
  Users,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function OverflowMenu() {
  const { activePersona } = useAuth();
  const isStaff = activePersona !== "athlete";
  const soon = (label: string) => () =>
    toast.info(`${label} is coming soon`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuItem onSelect={soon("Attendance")}>
          <CalendarCheck2 className="mr-2 h-4 w-4" /> Attendance
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={soon("Membership")}>
          <CreditCard className="mr-2 h-4 w-4" /> Membership
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={soon("Settings")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Staff</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/staff">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Staff Overview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/staff/classes">
                <CalendarCheck2 className="mr-2 h-4 w-4" /> Class Day
              </Link>
            </DropdownMenuItem>
            {(activePersona === "programmer" || activePersona === "admin") && (
              <DropdownMenuItem asChild>
                <Link to="/staff/programming">
                  <ClipboardList className="mr-2 h-4 w-4" /> Programming
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/staff/roster">
                <Users className="mr-2 h-4 w-4" /> Roster
              </Link>
            </DropdownMenuItem>
            {activePersona === "admin" && (
              <DropdownMenuItem asChild>
                <Link to="/staff/memberships">
                  <CreditCard className="mr-2 h-4 w-4" /> Memberships
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}