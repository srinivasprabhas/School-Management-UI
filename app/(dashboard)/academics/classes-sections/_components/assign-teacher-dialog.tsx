"use client"

import { useEffect, useState } from "react"

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
import { useTeachers } from "@/lib/data/store/entities"
import type { ClassSection } from "@/lib/data/types"

interface AssignTeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: ClassSection | null
  onSubmit: (teacherId: string | undefined) => void
}

export function AssignTeacherDialog({ open, onOpenChange, section, onSubmit }: AssignTeacherDialogProps) {
  const { items: teachers } = useTeachers()
  const [teacherId, setTeacherId] = useState("")

  useEffect(() => {
    if (open) setTeacherId(section?.classTeacherId ?? "")
  }, [open, section])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(teacherId || undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Class Teacher</DialogTitle>
          <DialogDescription>
            {section ? `Choose a class teacher for ${section.className} — Section ${section.section}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field>
            <FieldLabel htmlFor="assign-teacher">Class Teacher</FieldLabel>
            <Select value={teacherId} onValueChange={(v) => setTeacherId(v ?? "")}>
              <SelectTrigger id="assign-teacher" className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
