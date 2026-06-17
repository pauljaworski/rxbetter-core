import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarCheck2, CreditCard, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function profileInitials(
  firstName: string | null,
  lastName: string | null,
  displayName: string | null,
): string {
  if (firstName?.trim() && lastName?.trim()) {
    return `${firstName.trim()[0]}${lastName.trim()[0]}`.toUpperCase();
  }
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return displayName.trim().slice(0, 2).toUpperCase();
  }
  return "?";
}

export function AthleteProfileMenu() {
  const { displayName, firstName, lastName, avatarUrl, signOut } = useAuth();
  const initials = useMemo(
    () => profileInitials(firstName, lastName, displayName),
    [firstName, lastName, displayName],
  );

  const soon = (label: string) => () => toast.info(`${label} is coming soon`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "rounded-full ring-offset-background transition-shadow",
            "hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Avatar className="h-8 w-8 border border-border/60">
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {displayName ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={soon("Membership")}>
          <CreditCard className="mr-2 h-4 w-4" />
          Membership
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={soon("Settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={soon("Attendance")}>
          <CalendarCheck2 className="mr-2 h-4 w-4" />
          Attendance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
