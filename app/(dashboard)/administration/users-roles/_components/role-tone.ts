import type { StatusTone } from "@/components/shared/status-badge"
import type { Role } from "@/lib/rbac/types"

/**
 * Local role -> tone map for this page. There are 11 roles but only 5 shared
 * StatusTones, so visually similar roles are grouped under the same tone:
 * leadership (destructive), deputy/finance (warning), academic/library staff
 * (info), front-office/operations (success), external users (neutral).
 */
const ROLE_TONE: Record<Role, StatusTone> = {
  super_admin: "destructive",
  principal: "destructive",
  vice_principal: "warning",
  accountant: "warning",
  teacher: "info",
  librarian: "info",
  receptionist: "success",
  transport_manager: "success",
  hostel_manager: "success",
  parent: "neutral",
  student: "neutral",
}

export function toneForRole(role: string): StatusTone {
  return ROLE_TONE[role as Role] ?? "neutral"
}
