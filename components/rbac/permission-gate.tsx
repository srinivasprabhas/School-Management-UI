"use client"

import { usePermission } from "@/hooks/use-permission"
import type { Permission } from "@/lib/rbac/types"

interface PermissionGateProps {
  permission: Permission | Permission[]
  mode?: "any" | "all"
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({
  permission,
  mode = "any",
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermission()

  const allowed = Array.isArray(permission)
    ? mode === "all"
      ? canAll(permission)
      : canAny(permission)
    : can(permission)

  return allowed ? <>{children}</> : <>{fallback}</>
}
