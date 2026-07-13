"use client"

import { useCallback } from "react"

import { useCurrentUser } from "@/lib/rbac/current-user-context"
import type { AuditLogEntry } from "@/lib/data/types"
import { useAuditLog } from "./store/entities"

interface LogActivityInput {
  action: AuditLogEntry["action"]
  module: string
  entityType: string
  entityId?: string
  description: string
}

let auditSeq = 0

/** Call from any module's create/update/delete mutation to append an immutable audit trail entry. */
export function useLogActivity() {
  const { user } = useCurrentUser()
  const { add } = useAuditLog()

  return useCallback(
    (input: LogActivityInput) => {
      auditSeq += 1
      add({
        id: `audit_live_${auditSeq}`,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: input.action,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        timestamp: new Date().toISOString(),
        ipAddress: "127.0.0.1",
      })
    },
    [add, user]
  )
}
