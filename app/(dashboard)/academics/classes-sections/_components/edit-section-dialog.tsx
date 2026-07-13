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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { ClassSection } from "@/lib/data/types"

interface EditSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: ClassSection | null
  onSubmit: (patch: Partial<ClassSection>) => void
}

interface FormValues {
  section: string
  roomNo: string
  capacity: string
}

const EMPTY_FORM: FormValues = { section: "", roomNo: "", capacity: "" }

export function EditSectionDialog({ open, onOpenChange, section, onSubmit }: EditSectionDialogProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)

  useEffect(() => {
    if (open && section) {
      setValues({ section: section.section, roomNo: section.roomNo, capacity: String(section.capacity) })
    }
  }, [open, section])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      section: values.section.trim().toUpperCase(),
      roomNo: values.roomNo,
      capacity: Number(values.capacity) || 1,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
          <DialogDescription>
            {section ? `Update details for ${section.className} — Section ${section.section}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="edit-section">Section</FieldLabel>
                <Input
                  id="edit-section"
                  required
                  maxLength={2}
                  value={values.section}
                  onChange={(e) => set("section", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-room">Room No.</FieldLabel>
                <Input id="edit-room" required value={values.roomNo} onChange={(e) => set("roomNo", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="edit-capacity">Capacity</FieldLabel>
              <Input
                id="edit-capacity"
                type="number"
                min={1}
                value={values.capacity}
                onChange={(e) => set("capacity", e.target.value)}
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
