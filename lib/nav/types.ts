import type { LucideIcon } from "lucide-react"

import type { Permission, Role } from "@/lib/rbac/types"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: string
  roles?: Role[]
  permission?: Permission
  items?: NavItem[]
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
  roles?: Role[]
}
