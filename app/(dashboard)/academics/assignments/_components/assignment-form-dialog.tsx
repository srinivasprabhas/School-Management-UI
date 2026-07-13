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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLogActivity } from "@/lib/data/audit"
import { useClassSections, useStudents, useSubjects, useTeachers } from "@/lib/data/store/entities"
import type { Assignment } from "@/lib/data/types"

interface AssignmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (assignment: Assignment) => void
}

interface FormValues {
  title: string
  type: Assignment["type"]
  classSectionId: string
  subjectId: string
  teacherId: string
  assignedDate: string
  dueDate: string
  description: string
}

const todayIso = new Date().toISOString().slice(0, 10)

const EMPTY_FORM: FormValues = {
  title: "",
  type: "homework",
  classSectionId: "",
  subjectId: "",
  teacherId: "",
  assignedDate: todayIso,
  dueDate: todayIso,
  description: "",
}

export function AssignmentFormDialog({ open, onOpenChange, onSubmit }: AssignmentFormDialogProps) {
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const { items: teachers } = useTeachers()
  const { items: students } = useStudents()
  const logActivity = useLogActivity()
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)

  useEffect(() => {
    if (open) setValues(EMPTY_FORM)
  }, [open])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim() || !values.classSectionId || !values.subjectId || !values.teacherId) {
      toast.error("Please fill in all required fields.")
      return
    }
    const total = students.filter((s) => s.classSectionId === values.classSectionId).length
    const result: Assignment = {
      id: `asg_new_${Date.now()}`,
      title: values.title.trim(),
      type: values.type,
      classSectionId: values.classSectionId,
      subjectId: values.subjectId,
      teacherId: values.teacherId,
      assignedDate: values.assignedDate,
      dueDate: values.dueDate,
      description: values.description,
      submittedCount: 0,
      totalStudents: total,
      status: "open",
    }
    onSubmit(result)
    logActivity({
      action: "create",
      module: "Academics",
      entityType: "Assignment",
      entityId: result.id,
      description: `Added ${result.type} "${result.title}"`,
    })
    toast.success("Assignment added", { description: result.title })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] scrollbar-thin overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
          <DialogDescription>Create a new homework, assignment, or project for a class.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="asg-title">Title</FieldLabel>
              <Input id="asg-title" required value={values.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="asg-type">Type</FieldLabel>
                <Select value={values.type} onValueChange={(v) => set("type", (v ?? "homework") as Assignment["type"])}>
                  <SelectTrigger id="asg-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="asg-class">Class/Section</FieldLabel>
                <Select value={values.classSectionId} onValueChange={(v) => set("classSectionId", v ?? "")}>
                  <SelectTrigger id="asg-class" className="w-full">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="asg-subject">Subject</FieldLabel>
                <Select value={values.subjectId} onValueChange={(v) => set("subjectId", v ?? "")}>
                  <SelectTrigger id="asg-subject" className="w-full">
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
                <FieldLabel htmlFor="asg-teacher">Teacher</FieldLabel>
                <Select value={values.teacherId} onValueChange={(v) => set("teacherId", v ?? "")}>
                  <SelectTrigger id="asg-teacher" className="w-full">
                    <SelectValue placeholder="Select teacher" />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="asg-assigned">Assigned Date</FieldLabel>
                <Input
                  id="asg-assigned"
                  type="date"
                  required
                  value={values.assignedDate}
                  onChange={(e) => set("assignedDate", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="asg-due">Due Date</FieldLabel>
                <Input id="asg-due" type="date" required value={values.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="asg-description">Description</FieldLabel>
              <Textarea
                id="asg-description"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Assignment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
