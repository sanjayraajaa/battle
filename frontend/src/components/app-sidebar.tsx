import * as React from "react"
import {
  BarChart,
  DollarSign,
  Home,
  Monitor,
  ShoppingCart,
  Tag,
  Users,
  GalleryVerticalEnd,
  Command,
  AudioWaveform,
  FolderKanban,
  CheckSquare,
  Clock,

} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useFrappeAuth } from "frappe-react-sdk"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentUser } = useFrappeAuth();

  const data = {
    user: {
      name: currentUser || "User",
      email: currentUser || "user@example.com",
      avatar: "",
    },
    teams: [
      {
        name: "Battle App",
        logo: GalleryVerticalEnd,
        plan: "Pro Plan",
      },
    ],
    navMain: [
      {
        title: "Projects",
        url: "/projects",
        icon: FolderKanban,
      },
      {
        title: "Tasks",
        url: "/tasks",
        icon: CheckSquare,
      },

      {
        title: "Timesheet",
        url: "/timesheet",
        icon: Clock,
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
