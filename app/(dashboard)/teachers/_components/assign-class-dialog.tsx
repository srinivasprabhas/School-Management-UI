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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClassSections, useSubjects } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { AssignedClass, Teacher } from "@/lib/data/types"

interface AssignClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher?: Teacher
  onSubmit: (assignedClasses: AssignedClass[]) => void
}

/** Shared "Assign Class" dialog used by both the teachers list row action and the teacher profile page. */
export function AssignClassDialog({ open, onOpenChange, teacher, onSubmit }: AssignClassDialogProps) {
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const logActivity = useLogActivity()

  const [classSectionId, setClassSectionId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [role, setRole] = useState<AssignedClass["role"]>("subject_teacher")

  useEffect(() => {
    if (open) {
      setClassSectionId("")
      setSubjectId("")
      setRole("subject_teacher")
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!teacher) return
    if (!classSectionId || !subjectId) {
      toast.error("Please select a class section and subject.")
      return
    }

    const entry: AssignedClass = { classSectionId, subjectId, role }
    onSubmit([...teacher.assignedClasses, entry])
    logActivity({
      action: "update",
      module: "Teachers",
      entityType: "Teacher",
      entityId: teacher.id,
      description: `Assigned ${teacher.firstName} ${teacher.lastName} to a new class section`,
    })
    toast.success("Class assigned", {
      description: `${teacher.firstName} ${teacher.lastName} has been assigned.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Class</DialogTitle>
          <DialogDescription>
            {teacher
              ? `Assign ${teacher.firstName} ${teacher.lastName} to a class section and subject.`
              : "Assign a class section and subject."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="assignClassSection">Class & Section</FieldLabel>
            <Select value={classSectionId} onValueChange={(v) => setClassSectionId(v ?? "")}>
              <SelectTrigger id="assignClassSection" className="w-full">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classSections.map((cs) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    {cs.className} — {cs.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="assignSubject">Subject</FieldLabel>
            <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
              <SelectTrigger id="assignSubject" className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as AssignedClass["role"])}
              className="flex flex-col gap-2"
            >
              <FieldLabel htmlFor="role-class-teacher" className="font-normal">
                <RadioGroupItem value="class_teacher" id="role-class-teacher" />
                Class Teacher
              </FieldLabel>
              <FieldLabel htmlFor="role-subject-teacher" className="font-normal">
                <RadioGroupItem value="subject_teacher" id="role-subject-teacher" />
                Subject Teacher
              </FieldLabel>
            </RadioGroup>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Assign</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
