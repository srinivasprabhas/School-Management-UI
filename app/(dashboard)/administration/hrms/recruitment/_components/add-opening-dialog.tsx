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
import { useLogActivity } from "@/lib/data/audit"
import { toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { JobOpening } from "@/lib/data/types"

interface AddOpeningDialogProps {
  trigger: React.ReactElement
  onSubmit: (opening: JobOpening) => void
}

const EMPTY = { title: "", department: "", openings: "1" }

export function AddOpeningDialog({ trigger, onSubmit }: AddOpeningDialogProps) {
  const logActivity = useLogActivity()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)

  useEffect(() => {
    if (open) setValues(EMPTY)
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const opening: JobOpening = {
      id: `job_new_${Date.now()}`,
      title: values.title,
      department: values.department,
      openings: Number(values.openings) || 1,
      status: "open",
      postedDate: toISODate(SEED_TODAY),
    }
    onSubmit(opening)
    logActivity({
      action: "create",
      module: "HRMS",
      entityType: "JobOpening",
      entityId: opening.id,
      description: `Posted new opening: ${opening.title}`,
    })
    toast.success("Opening posted", { description: opening.title })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Opening</DialogTitle>
          <DialogDescription>Post a new job opening for recruitment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="openingTitle">Title</FieldLabel>
              <Input
                id="openingTitle"
                required
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="openingDepartment">Department</FieldLabel>
                <Input
                  id="openingDepartment"
                  required
                  value={values.department}
                  onChange={(e) => setValues((v) => ({ ...v, department: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="openingCount">No. of openings</FieldLabel>
                <Input
                  id="openingCount"
                  type="number"
                  min={1}
                  required
                  value={values.openings}
                  onChange={(e) => setValues((v) => ({ ...v, openings: e.target.value }))}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Opening</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
