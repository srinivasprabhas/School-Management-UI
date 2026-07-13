"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useNavBadges } from "@/hooks/use-nav-badges"
import { usePermission } from "@/hooks/use-permission"
import type { NavItem } from "@/lib/nav/types"

interface NavCollapsibleItemProps {
  item: NavItem
  subItems: NavItem[]
  isActive: boolean
  isSubActive: boolean
  badge: number | string | undefined
  pathname: string
}

function NavCollapsibleItem({
  item,
  subItems,
  isActive,
  isSubActive,
  badge,
  pathname,
}: NavCollapsibleItemProps) {
  // Lazy initializer runs once at mount — auto-expands the group containing the
  // active route on first load, without fighting the user's later manual toggles
  // (which would otherwise trigger Base UI's "defaultOpen changed after mount" warning).
  const [open, setOpen] = useState(() => isActive || isSubActive)

  return (
    <Collapsible open={open} onOpenChange={setOpen} render={<SidebarMenuItem />}>
      <SidebarMenuButton isActive={isActive} tooltip={item.label} render={<Link href={item.href} />}>
        <item.icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
      {badge !== undefined ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
      <CollapsibleTrigger render={<SidebarMenuAction className="aria-expanded:rotate-90" />}>
        <ChevronRightIcon />
        <span className="sr-only">Toggle</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {subItems.map((sub) => (
            <SidebarMenuSubItem key={sub.id}>
              <SidebarMenuSubButton isActive={pathname === sub.href} render={<Link href={sub.href} />}>
                <span>{sub.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function NavMain({ groups }: { groups: import("@/lib/nav/types").NavGroup[] }) {
  const pathname = usePathname()
  const { role } = usePermission()
  const badges = useNavBadges()

  const isVisible = (item: NavItem) => !item.roles || item.roles.includes(role)
  const visibleGroups = groups.filter((g) => !g.roles || g.roles.includes(role))

  return (
    <>
      {visibleGroups.map((group) => {
        const items = group.items.filter(isVisible)
        if (items.length === 0) return null

        return (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const badge = item.badgeKey ? badges[item.badgeKey] : undefined
                const subItems = item.items?.filter(isVisible) ?? []
                const isSubActive = subItems.some((sub) => pathname === sub.href)

                if (subItems.length === 0) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {badge !== undefined ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
                    </SidebarMenuItem>
                  )
                }

                return (
                  <NavCollapsibleItem
                    key={item.id}
                    item={item}
                    subItems={subItems}
                    isActive={isActive}
                    isSubActive={isSubActive}
                    badge={badge}
                    pathname={pathname}
                  />
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}
