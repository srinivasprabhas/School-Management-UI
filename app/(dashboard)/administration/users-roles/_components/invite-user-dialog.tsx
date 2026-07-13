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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLogActivity } from "@/lib/data/audit"
import { toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { ROLES, ROLE_LABELS } from "@/lib/rbac/types"
import type { Role } from "@/lib/rbac/types"
import type { AppUser } from "@/lib/data/types"

interface InviteUserDialogProps {
  trigger: React.ReactElement
  onSubmit: (user: AppUser) => void
}

const EMPTY = { name: "", email: "", role: "teacher" as Role }

export function InviteUserDialog({ trigger, onSubmit }: InviteUserDialogProps) {
  const logActivity = useLogActivity()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)

  useEffect(() => {
    if (open) setValues(EMPTY)
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const user: AppUser = {
      id: `au_new_${Date.now()}`,
      name: values.name,
      email: values.email,
      role: values.role,
      status: "invited",
      createdDate: toISODate(SEED_TODAY),
    }
    onSubmit(user)
    logActivity({
      action: "create",
      module: "Users & Roles",
      entityType: "AppUser",
      entityId: user.id,
      description: `Invited ${user.name} as ${ROLE_LABELS[values.role]}`,
    })
    toast.success("Invitation sent", { description: `${user.name} — ${user.email}` })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Send an invitation to join MyCampus360.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="inviteName">Name</FieldLabel>
              <Input
                id="inviteName"
                required
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="inviteEmail">Email</FieldLabel>
              <Input
                id="inviteEmail"
                type="email"
                required
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="inviteRole">Role</FieldLabel>
              <Select
                value={values.role}
                onValueChange={(v) => setValues((val) => ({ ...val, role: (v ?? "teacher") as Role }))}
              >
                <SelectTrigger id="inviteRole" className="w-full">
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
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Send Invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
