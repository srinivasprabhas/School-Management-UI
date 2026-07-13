"use client"

import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/shared/logo"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { getNavGroupsForRole } from "@/lib/nav/nav-config"
import { usePermission } from "@/hooks/use-permission"
import { useSchoolProfile } from "@/lib/data/store/entities"

export function AppSidebar() {
  const { role } = usePermission()
  const { value: school } = useSchoolProfile()
  const groups = getNavGroupsForRole(role)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-16" render={<Link href="/dashboard" />}>
              <Logo size={44} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">MyCampus360</span>
                <span className="truncate text-xs text-muted-foreground">{school.name}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
