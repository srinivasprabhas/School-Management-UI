"use client"

import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { hasPermission } from "@/lib/rbac/role-permissions"
import type { Permission } from "@/lib/rbac/types"

export function usePermission() {
  const { user } = useCurrentUser()

  const can = (permission: Permission) => hasPermission(user.role, permission)
  const canAny = (permissions: Permission[]) => permissions.some(can)
  const canAll = (permissions: Permission[]) => permissions.every(can)

  return { role: user.role, can, canAny, canAll }
}
