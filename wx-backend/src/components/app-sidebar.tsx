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
import { LayoutDashboardIcon, FileTextIcon, Settings2Icon, SearchIcon, GhostIcon, BookHeartIcon, UsersIcon, ShieldIcon } from "lucide-react"

const data = {
  user: {
    name: "Admin",
    email: "admin@roco.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "数据总览 Dashboard",
      url: "/dashboard",
      icon: (
        <LayoutDashboardIcon />
      ),
    },
    {
      title: "攻略管理 Articles",
      url: "/dashboard/articles",
      icon: (
        <FileTextIcon />
      ),
    },
    {
      title: "图鉴管理 Elves",
      url: "/dashboard/elves",
      icon: (
        <GhostIcon />
      ),
    },
    {
      title: "宠物蛋集 Eggs",
      url: "/dashboard/eggs",
      icon: (
        <BookHeartIcon />
      ),
    },
    {
      title: "用户管理 Users",
      url: "/dashboard/users",
      icon: (
        <UsersIcon />
      ),
    },
  ],
  navSecondary: [
    {
      title: "全局设置 Settings",
      url: "/dashboard/settings",
      icon: (
        <Settings2Icon />
      ),
    },
    {
      title: "搜索系统 Search",
      url: "/dashboard/search",
      icon: (
        <SearchIcon />
      ),
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
