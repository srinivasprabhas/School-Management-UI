"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLogActivity } from "@/lib/data/audit"
import { useClasses, useTeachers } from "@/lib/data/store/entities"
import type { Subject } from "@/lib/data/types"

interface SubjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject?: Subject
  onSubmit: (subject: Subject) => void
}

interface FormValues {
  name: string
  code: string
  type: Subject["type"]
  applicableClassIds: string[]
  teacherIds: string[]
  periodsPerWeek: string
}

const EMPTY_FORM: FormValues = {
  name: "",
  code: "",
  type: "core",
  applicableClassIds: [],
  teacherIds: [],
  periodsPerWeek: "4",
}

function subjectToForm(s: Subject): FormValues {
  return {
    name: s.name,
    code: s.code,
    type: s.type,
    applicableClassIds: s.applicableClassIds,
    teacherIds: s.teacherIds,
    periodsPerWeek: String(s.periodsPerWeek),
  }
}

export function SubjectFormDialog({ open, onOpenChange, subject, onSubmit }: SubjectFormDialogProps) {
  const { items: classes } = useClasses()
  const { items: teachers } = useTeachers()
  const logActivity = useLogActivity()
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)

  useEffect(() => {
    if (open) setValues(subject ? subjectToForm(subject) : EMPTY_FORM)
  }, [open, subject])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function toggleClass(id: string) {
    setValues((v) => ({
      ...v,
      applicableClassIds: v.applicableClassIds.includes(id)
        ? v.applicableClassIds.filter((c) => c !== id)
        : [...v.applicableClassIds, id],
    }))
  }

  function toggleTeacher(id: string) {
    setValues((v) => ({
      ...v,
      teacherIds: v.teacherIds.includes(id) ? v.teacherIds.filter((t) => t !== id) : [...v.teacherIds, id],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.name.trim() || !values.code.trim()) {
      toast.error("Subject name and code are required.")
      return
    }
    const result: Subject = {
      id: subject?.id ?? `sub_new_${Date.now()}`,
      name: values.name.trim(),
      code: values.code.trim(),
      type: values.type,
      applicableClassIds: values.applicableClassIds,
      teacherIds: values.teacherIds,
      periodsPerWeek: Number(values.periodsPerWeek) || 1,
      status: subject?.status ?? "active",
    }
    onSubmit(result)
    logActivity({
      action: subject ? "update" : "create",
      module: "Academics",
      entityType: "Subject",
      entityId: result.id,
      description: `${subject ? "Updated" : "Added"} subject ${result.name}`,
    })
    toast.success(subject ? "Subject updated" : "Subject added", { description: `${result.name} (${result.code})` })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] scrollbar-thin overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          <DialogDescription>
            {subject ? "Update this subject's details." : "Add a new subject to the catalog."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="subjectName">Name</FieldLabel>
                <Input id="subjectName" required value={values.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="subjectCode">Code</FieldLabel>
                <Input id="subjectCode" required value={values.code} onChange={(e) => set("code", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="subjectType">Type</FieldLabel>
                <Select value={values.type} onValueChange={(v) => set("type", (v ?? "core") as Subject["type"])}>
                  <SelectTrigger id="subjectType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                    <SelectItem value="extra_curricular">Extra Curricular</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="periodsPerWeek">Periods/Week</FieldLabel>
                <Input
                  id="periodsPerWeek"
                  type="number"
                  min={1}
                  max={10}
                  value={values.periodsPerWeek}
                  onChange={(e) => set("periodsPerWeek", e.target.value)}
                />
              </Field>
            </div>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend variant="label">Classes Applicable</FieldLegend>
              <div className="grid max-h-40 grid-cols-2 gap-2 scrollbar-thin overflow-y-auto rounded-md border p-3">
                {classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={values.applicableClassIds.includes(c.id)}
                      onCheckedChange={() => toggleClass(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label">Teachers</FieldLegend>
              <div className="grid max-h-40 grid-cols-2 gap-2 scrollbar-thin overflow-y-auto rounded-md border p-3">
                {teachers.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={values.teacherIds.includes(t.id)} onCheckedChange={() => toggleTeacher(t.id)} />
                    {t.firstName} {t.lastName}
                  </label>
                ))}
              </div>
            </FieldSet>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{subject ? "Save Changes" : "Add Subject"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
