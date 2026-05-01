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
  FolderTreeIcon,
  GitBranchIcon,
  PackageIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  ShieldIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react"

const data = {
  user: {
    name: "管理员",
    email: "admin@roco.com",
    avatar: "/imgs/avatar/default-avatar.webp",
  },
  navMain: [
    {
      title: "仪表盘",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "攻略管理",
      url: "/dashboard/articles",
      icon: <FileTextIcon />,
    },
    {
      title: "精灵图鉴",
      url: "/dashboard/elves",
      icon: <GhostIcon />,
    },
    {
      title: "分类管理",
      url: "/dashboard/categories",
      icon: <FolderTreeIcon />,
    },
    {
      title: "道具管理",
      url: "/dashboard/items",
      icon: <PackageIcon />,
    },
    {
      title: "宠物蛋",
      url: "/dashboard/eggs",
      icon: <BookHeartIcon />,
    },
    {
      title: "蛋组管理",
      url: "/dashboard/egg-groups",
      icon: <GitBranchIcon />,
    },
    {
      title: "远行商人",
      url: "/dashboard/shop",
      icon: <StoreIcon />,
    },
    {
      title: "用户管理",
      url: "/dashboard/users",
      icon: <UsersIcon />,
    },
  ],
  navSecondary: [
    {
      title: "系统配置",
      url: "/dashboard/system-configs",
      icon: <SlidersHorizontalIcon />,
    },
    {
      title: "搜索",
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
