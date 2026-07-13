"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { useLogActivity } from "@/lib/data/audit"
import {
  useAcademicSession,
  useClassSections,
  useExamSubjects,
  useExams,
  useSubjects,
} from "@/lib/data/store/entities"
import type { Exam, ExamSubject } from "@/lib/data/types"
import { ExamSubjectRowsEditor, type DraftExamSubjectRow } from "../../_components/exam-subject-rows-editor"

export function CreateExamForm() {
  const router = useRouter()
  const { add: addExam } = useExams()
  const { addMany: addExamSubjects } = useExamSubjects()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const { value: academicSession } = useAcademicSession()
  const logActivity = useLogActivity()

  const [name, setName] = useState("")
  const [term, setTerm] = useState(academicSession.terms[0]?.name ?? "")
  const [academicYear, setAcademicYear] = useState(academicSession.year)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [rows, setRows] = useState<DraftExamSubjectRow[]>([])
  const [pending, setPending] = useState(false)

  const selectedClassSections = classSections.filter((cs) => selectedClassIds.includes(cs.id))

  function toggleClass(id: string, checked: boolean) {
    setSelectedClassIds((prev) => (checked ? [...prev, id] : prev.filter((c) => c !== id)))
  }

  function handleSave(status: Exam["status"]) {
    if (!name.trim()) {
      toast.error("Please enter an exam name.")
      return
    }
    if (!startDate || !endDate) {
      toast.error("Please set the start and end dates.")
      return
    }
    if (status === "scheduled") {
      if (selectedClassIds.length === 0) {
        toast.error("Select at least one class.")
        return
      }
      if (rows.length === 0) {
        toast.error("Add at least one subject.")
        return
      }
      const incomplete = rows.some((r) => !r.classSectionId || !r.subjectId || !r.examDate)
      if (incomplete) {
        toast.error("Complete all subject rows before creating the exam.")
        return
      }
    }

    setPending(true)
    const examId = `exam_new_${Date.now()}`
    const newExam: Exam = {
      id: examId,
      name: name.trim(),
      term,
      academicYear,
      classSectionIds: selectedClassIds,
      startDate,
      endDate,
      status,
    }
    const examSubjectRows: ExamSubject[] = rows
      .filter((r) => r.classSectionId && r.subjectId)
      .map((r, i) => ({
        id: `exsub_${examId}_${i}`,
        examId,
        classSectionId: r.classSectionId,
        subjectId: r.subjectId,
        examDate: r.examDate,
        startTime: r.startTime,
        durationMinutes: r.durationMinutes,
        maxMarks: r.maxMarks,
        passMarks: r.passMarks,
      }))

    addExam(newExam)
    if (examSubjectRows.length) addExamSubjects(examSubjectRows)
    logActivity({
      action: "create",
      module: "Examinations",
      entityType: "Exam",
      entityId: examId,
      description: `Created exam ${newExam.name} (${status})`,
    })
    toast.success(status === "draft" ? "Exam saved as draft" : "Exam created", {
      description: newExam.name,
    })
    router.push(`/examinations/${examId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Create Exam" description="Schedule a new examination." />

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="examName">Exam Name</FieldLabel>
              <Input
                id="examName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mid-Term Examination"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="term">Term</FieldLabel>
              <Select value={term} onValueChange={(v) => setTerm(v ?? "")}>
                <SelectTrigger id="term" className="w-full">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {academicSession.terms.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="academicYear">Academic Year</FieldLabel>
              <Input id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="endDate">End Date</FieldLabel>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Classes Included</FieldLabel>
            <div className="grid max-h-48 grid-cols-2 gap-2 scrollbar-thin overflow-y-auto rounded-lg border p-3 sm:grid-cols-3">
              {classSections.map((cs) => (
                <label key={cs.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedClassIds.includes(cs.id)}
                    onCheckedChange={(checked) => toggleClass(cs.id, !!checked)}
                  />
                  {cs.className} - {cs.section}
                </label>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <ExamSubjectRowsEditor
            rows={rows}
            onChange={setRows}
            classSections={selectedClassSections}
            subjects={subjects}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={pending} onClick={() => handleSave("draft")}>
          Save as Draft
        </Button>
        <Button disabled={pending} onClick={() => handleSave("scheduled")}>
          Create Exam
        </Button>
      </div>
    </div>
  )
}
