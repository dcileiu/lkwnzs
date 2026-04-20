"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  BookHeartIcon,
  FileTextIcon,
  GhostIcon,
  LayoutDashboardIcon,
  SearchIcon,
  Settings2Icon,
  Share2Icon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Admin",
    email: "admin@roco.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Articles",
      url: "/dashboard/articles",
      icon: <FileTextIcon />,
    },
    {
      title: "Elves",
      url: "/dashboard/elves",
      icon: <GhostIcon />,
    },
    {
      title: "Evolutions",
      url: "/dashboard/evolutions",
      icon: <Share2Icon />,
    },
    {
      title: "Eggs",
      url: "/dashboard/eggs",
      icon: <BookHeartIcon />,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: <UsersIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Search",
      url: "/dashboard/search",
      icon: <SearchIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <ShieldIcon className="size-5!" />
              <span className="text-base font-semibold">洛克王国助手 CMS</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
