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
import { Menu, CalendarCheck2, CreditCard, Settings, User, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

export function OverflowMenu() {
  const soon = (label: string) => () => toast.info(`${label} is coming soon`);

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
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/history" className="flex cursor-pointer items-center">
            <HistoryIcon className="mr-2 h-4 w-4" /> History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={soon("Attendance")}>
          <CalendarCheck2 className="mr-2 h-4 w-4" /> Attendance
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={soon("Membership")}>
          <CreditCard className="mr-2 h-4 w-4" /> Membership
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={soon("Settings")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
