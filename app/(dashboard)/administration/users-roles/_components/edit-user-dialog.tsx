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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLogActivity } from "@/lib/data/audit"
import type { AppUser } from "@/lib/data/types"

interface EditUserDialogProps {
  user: AppUser | null
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, patch: Partial<AppUser>) => void
}

export function EditUserDialog({ user, onOpenChange, onSubmit }: EditUserDialogProps) {
  const logActivity = useLogActivity()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    onSubmit(user.id, { name, email })
    logActivity({
      action: "update",
      module: "Users & Roles",
      entityType: "AppUser",
      entityId: user.id,
      description: `Updated user details for ${name}`,
    })
    toast.success("User updated")
    onOpenChange(false)
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update this user&apos;s name and email.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="editUserName">Name</FieldLabel>
              <Input id="editUserName" required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="editUserEmail">Email</FieldLabel>
              <Input
                id="editUserEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </FieldGroup>
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
