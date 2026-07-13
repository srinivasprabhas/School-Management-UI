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
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAcademicSession, useClasses, useClassSections, useTeachers } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"

interface AddClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormValues {
  className: string
  academicYear: string
  section: string
  roomNo: string
  capacity: string
  classTeacherId: string
}

const EMPTY_FORM: FormValues = {
  className: "",
  academicYear: "",
  section: "A",
  roomNo: "",
  capacity: "30",
  classTeacherId: "",
}

export function AddClassDialog({ open, onOpenChange }: AddClassDialogProps) {
  const { value: session } = useAcademicSession()
  const { add: addClass } = useClasses()
  const { add: addSection } = useClassSections()
  const { items: teachers } = useTeachers()
  const logActivity = useLogActivity()

  const [values, setValues] = useState<FormValues>(EMPTY_FORM)

  useEffect(() => {
    if (open) setValues({ ...EMPTY_FORM, academicYear: session.year })
  }, [open, session.year])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.className.trim() || !values.section.trim()) {
      toast.error("Class name and section are required.")
      return
    }

    const classId = `cls_new_${Date.now()}`
    addClass({ id: classId, name: values.className.trim(), academicYear: values.academicYear })

    const sectionLetter = values.section.trim().toUpperCase()
    const sectionId = `sec_${classId}_${sectionLetter}`
    addSection({
      id: sectionId,
      classId,
      className: values.className.trim(),
      section: sectionLetter,
      classTeacherId: values.classTeacherId || undefined,
      roomNo: values.roomNo,
      capacity: Number(values.capacity) || 30,
    })

    logActivity({
      action: "create",
      module: "Academics",
      entityType: "ClassSection",
      entityId: sectionId,
      description: `Added class ${values.className} — Section ${sectionLetter}`,
    })
    toast.success("Class added", { description: `${values.className} — Section ${sectionLetter}` })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Class</DialogTitle>
          <DialogDescription>Create a new class along with its first section.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <FieldSet>
              <FieldLegend variant="label">Class</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="className">Class name</FieldLabel>
                  <Input
                    id="className"
                    required
                    placeholder="e.g. Grade 11"
                    value={values.className}
                    onChange={(e) => set("className", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="academicYear">Academic year</FieldLabel>
                  <Input
                    id="academicYear"
                    required
                    value={values.academicYear}
                    onChange={(e) => set("academicYear", e.target.value)}
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend variant="label">Add Section</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="section">Section</FieldLabel>
                  <Input
                    id="section"
                    required
                    maxLength={2}
                    placeholder="A"
                    value={values.section}
                    onChange={(e) => set("section", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="roomNo">Room No.</FieldLabel>
                  <Input
                    id="roomNo"
                    required
                    placeholder="e.g. 204"
                    value={values.roomNo}
                    onChange={(e) => set("roomNo", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={values.capacity}
                    onChange={(e) => set("capacity", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="classTeacher">Class teacher (optional)</FieldLabel>
                  <Select value={values.classTeacherId} onValueChange={(v) => set("classTeacherId", v ?? "")}>
                    <SelectTrigger id="classTeacher" className="w-full">
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
              </div>
            </FieldSet>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Class</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
