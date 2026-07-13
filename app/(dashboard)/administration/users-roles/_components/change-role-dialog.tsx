"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLogActivity } from "@/lib/data/audit"
import { ROLES, ROLE_LABELS } from "@/lib/rbac/types"
import type { Role } from "@/lib/rbac/types"
import type { AppUser } from "@/lib/data/types"

interface ChangeRoleDialogProps {
  user: AppUser | null
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, role: string) => void
}

export function ChangeRoleDialog({ user, onOpenChange, onSubmit }: ChangeRoleDialogProps) {
  const logActivity = useLogActivity()
  const [role, setRole] = useState<Role>("teacher")

  useEffect(() => {
    if (user) setRole((user.role as Role) ?? "teacher")
  }, [user])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    onSubmit(user.id, role)
    logActivity({
      action: "permission_change",
      module: "Users & Roles",
      entityType: "AppUser",
      entityId: user.id,
      description: `Changed role for ${user.name} to ${ROLE_LABELS[role]}`,
    })
    toast.success("Role updated", { description: `${user.name} is now ${ROLE_LABELS[role]}` })
    onOpenChange(false)
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>{user?.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field>
            <FieldLabel htmlFor="changeRole">Role</FieldLabel>
            <Select value={role} onValueChange={(v) => setRole((v ?? "teacher") as Role)}>
              <SelectTrigger id="changeRole" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
