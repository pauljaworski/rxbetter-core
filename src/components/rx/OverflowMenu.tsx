import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuLabel,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { Menu, CalendarCheck2, CreditCard, Settings } from "lucide-react";

import { toast } from "sonner";



export function OverflowMenu() {

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

      </DropdownMenuContent>

    </DropdownMenu>

  );

}

