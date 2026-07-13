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
import { useClassSections, useSubjects, useTeachers } from "@/lib/data/store/entities"
import type { LessonPlan } from "@/lib/data/types"

interface LessonPlanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (plan: LessonPlan) => void
}

interface FormValues {
  subjectId: string
  classSectionId: string
  teacherId: string
  topic: string
  weekStart: string
  weekEnd: string
  objectives: string
  status: LessonPlan["status"]
}

const todayIso = new Date().toISOString().slice(0, 10)

const EMPTY_FORM: FormValues = {
  subjectId: "",
  classSectionId: "",
  teacherId: "",
  topic: "",
  weekStart: todayIso,
  weekEnd: todayIso,
  objectives: "",
  status: "planned",
}

export function LessonPlanFormDialog({ open, onOpenChange, onSubmit }: LessonPlanFormDialogProps) {
  const { items: subjects } = useSubjects()
  const { items: classSections } = useClassSections()
  const { items: teachers } = useTeachers()
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
    if (!values.subjectId || !values.classSectionId || !values.teacherId || !values.topic.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }
    const result: LessonPlan = {
      id: `lp_new_${Date.now()}`,
      subjectId: values.subjectId,
      classSectionId: values.classSectionId,
      teacherId: values.teacherId,
      topic: values.topic.trim(),
      weekRange: `${values.weekStart} – ${values.weekEnd}`,
      objectives: values.objectives,
      status: values.status,
    }
    onSubmit(result)
    logActivity({
      action: "create",
      module: "Academics",
      entityType: "LessonPlan",
      entityId: result.id,
      description: `Added lesson plan "${result.topic}"`,
    })
    toast.success("Lesson plan added", { description: result.topic })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] scrollbar-thin overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Lesson Plan</DialogTitle>
          <DialogDescription>Plan an upcoming topic for a class.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="lp-subject">Subject</FieldLabel>
                <Select value={values.subjectId} onValueChange={(v) => set("subjectId", v ?? "")}>
                  <SelectTrigger id="lp-subject" className="w-full">
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
                <FieldLabel htmlFor="lp-class">Class</FieldLabel>
                <Select value={values.classSectionId} onValueChange={(v) => set("classSectionId", v ?? "")}>
                  <SelectTrigger id="lp-class" className="w-full">
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
            <Field>
              <FieldLabel htmlFor="lp-teacher">Teacher</FieldLabel>
              <Select value={values.teacherId} onValueChange={(v) => set("teacherId", v ?? "")}>
                <SelectTrigger id="lp-teacher" className="w-full">
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
            <Field>
              <FieldLabel htmlFor="lp-topic">Topic</FieldLabel>
              <Input id="lp-topic" required value={values.topic} onChange={(e) => set("topic", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="lp-week-start">Week Start</FieldLabel>
                <Input
                  id="lp-week-start"
                  type="date"
                  required
                  value={values.weekStart}
                  onChange={(e) => set("weekStart", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lp-week-end">Week End</FieldLabel>
                <Input
                  id="lp-week-end"
                  type="date"
                  required
                  value={values.weekEnd}
                  onChange={(e) => set("weekEnd", e.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="lp-objectives">Objectives</FieldLabel>
              <Textarea id="lp-objectives" value={values.objectives} onChange={(e) => set("objectives", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="lp-status">Status</FieldLabel>
              <Select value={values.status} onValueChange={(v) => set("status", (v ?? "planned") as LessonPlan["status"])}>
                <SelectTrigger id="lp-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Lesson Plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
