"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeftIcon, DownloadIcon, FileTextIcon, UploadIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"
import { useLogActivity } from "@/lib/data/audit"
import {
  useClassSections,
  useExamSubjects,
  useExams,
  useMarks,
  useStudents,
  useSubjects,
} from "@/lib/data/store/entities"
import { gradeFor } from "@/lib/data/seed/generate"
import type { ExamSubject, Mark, Subject } from "@/lib/data/types"

interface LocalMarkRow {
  marksObtained: string
  isAbsent: boolean
  remarks: string
}

export function MarksEntry({ examId }: { examId: string }) {
  const { items: exams } = useExams()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const { items: examSubjects } = useExamSubjects()
  const { items: students } = useStudents()
  const { items: marks, add: addMark, update: updateMark } = useMarks()
  const logActivity = useLogActivity()

  const exam = exams.find((e) => e.id === examId)

  const examClassSections = useMemo(
    () => classSections.filter((cs) => exam?.classSectionIds.includes(cs.id)),
    [classSections, exam]
  )

  const [selectedClassId, setSelectedClassId] = useState(examClassSections[0]?.id ?? "")
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)

  useEffect(() => {
    if (examClassSections.length && !examClassSections.some((cs) => cs.id === selectedClassId)) {
      setSelectedClassId(examClassSections[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examClassSections])

  const classSubjectOptions = useMemo(() => {
    return examSubjects
      .filter((es) => es.examId === examId && es.classSectionId === selectedClassId)
      .map((es) => {
        const subject = subjects.find((s) => s.id === es.subjectId)
        return subject ? { examSubject: es, subject } : null
      })
      .filter((x): x is { examSubject: ExamSubject; subject: Subject } => x !== null)
  }, [examSubjects, examId, selectedClassId, subjects])

  useEffect(() => {
    if (!classSubjectOptions.some((o) => o.subject.id === selectedSubjectId)) {
      setSelectedSubjectId(classSubjectOptions[0]?.subject.id ?? "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, classSubjectOptions])

  const activeExamSubject = classSubjectOptions.find((o) => o.subject.id === selectedSubjectId)?.examSubject

  const classStudents = useMemo(
    () =>
      students
        .filter((s) => s.classSectionId === selectedClassId && s.status === "active")
        .sort((a, b) => a.rollNo - b.rollNo),
    [students, selectedClassId]
  )

  const [localMarks, setLocalMarks] = useState<Record<string, LocalMarkRow>>({})

  useEffect(() => {
    if (!activeExamSubject) {
      setLocalMarks({})
      return
    }
    const next: Record<string, LocalMarkRow> = {}
    classStudents.forEach((student) => {
      const existing = marks.find(
        (m) => m.examId === examId && m.subjectId === activeExamSubject.subjectId && m.studentId === student.id
      )
      next[student.id] = {
        marksObtained: existing && !existing.isAbsent ? String(existing.marksObtained) : "",
        isAbsent: existing?.isAbsent ?? false,
        remarks: existing?.remarks ?? "",
      }
    })
    setLocalMarks(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedSubjectId])

  function setLocalRow(studentId: string, patch: Partial<LocalMarkRow>) {
    setLocalMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }))
  }

  const enteredCount = classStudents.filter((s) => {
    const row = localMarks[s.id]
    return row && (row.isAbsent || row.marksObtained !== "")
  }).length

  function persist(): boolean {
    if (!activeExamSubject) return false
    const maxMarks = activeExamSubject.maxMarks
    const hasInvalid = classStudents.some((s) => {
      const row = localMarks[s.id]
      if (!row || row.isAbsent) return false
      if (row.marksObtained === "") return false
      const val = Number(row.marksObtained)
      return Number.isNaN(val) || val > maxMarks || val < 0
    })
    if (hasInvalid) {
      toast.error(`Some marks exceed the maximum of ${maxMarks} or are invalid.`)
      return false
    }

    classStudents.forEach((student) => {
      const row = localMarks[student.id]
      if (!row) return
      const id = `mark_${examId}_${student.id}_${activeExamSubject.subjectId}`
      const marksObtained = row.isAbsent ? 0 : Number(row.marksObtained) || 0
      const patch: Mark = {
        id,
        examId,
        subjectId: activeExamSubject.subjectId,
        studentId: student.id,
        marksObtained,
        isAbsent: row.isAbsent,
        remarks: row.remarks || undefined,
      }
      if (marks.some((m) => m.id === id)) {
        updateMark(id, patch)
      } else {
        addMark(patch)
      }
    })
    return true
  }

  if (!exam) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="Exam not found"
        description="This exam may have been removed."
        action={
          <Button render={<Link href="/examinations" />} nativeButton={false}>
            Back to Examinations
          </Button>
        }
      />
    )
  }

  const activeSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name
  const activeClassSection = examClassSections.find((c) => c.id === selectedClassId)

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href={`/examinations/${examId}`} />}
          nativeButton={false}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to Exam
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Marks Entry</h1>
        <p className="text-sm text-muted-foreground">
          {exam.name} - {exam.term}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedClassId} onValueChange={(v) => setSelectedClassId(v ?? "")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {examClassSections.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.className} - {cs.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedSubjectId}
            onValueChange={(v) => setSelectedSubjectId(v ?? "")}
            disabled={classSubjectOptions.length === 0}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {classSubjectOptions.map((o) => (
                <SelectItem key={o.subject.id} value={o.subject.id}>
                  {o.subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger render={<Button variant="outline" />}>
            <UploadIcon data-icon="inline-start" />
            Bulk Import
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Import Marks</DialogTitle>
              <DialogDescription>Upload an Excel or CSV file matching the marks template.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              <UploadIcon className="size-6" />
              Drag and drop a file here, or click to browse
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              onClick={() => toast.info("Template download is a demo mock.")}
            >
              <DownloadIcon className="size-3.5" />
              Download Template
            </button>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setImportOpen(false)
                  toast.success("Import complete", { description: "Marks imported for the selected subject." })
                }}
              >
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!activeExamSubject ? (
        <EmptyState
          icon={FileTextIcon}
          title="Select a class and subject"
          description="Choose a class and subject configured for this exam to begin entering marks."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classStudents.map((student) => {
                const row = localMarks[student.id] ?? { marksObtained: "", isAbsent: false, remarks: "" }
                const numeric = Number(row.marksObtained)
                const isOverMax =
                  !row.isAbsent && row.marksObtained !== "" && (Number.isNaN(numeric) || numeric > activeExamSubject.maxMarks)
                const percent = row.isAbsent ? 0 : ((Number(row.marksObtained) || 0) / activeExamSubject.maxMarks) * 100
                const hasGrade = row.isAbsent || row.marksObtained !== ""
                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.rollNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{initials(`${student.firstName} ${student.lastName}`)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {student.firstName} {student.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={activeExamSubject.maxMarks}
                        disabled={row.isAbsent}
                        value={row.marksObtained}
                        onChange={(e) => setLocalRow(student.id, { marksObtained: e.target.value })}
                        className={cn(
                          "w-24",
                          isOverMax && "border-destructive ring-destructive/20 focus-visible:ring-destructive/20"
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={row.isAbsent}
                        onCheckedChange={(checked) => setLocalRow(student.id, { isAbsent: !!checked })}
                      />
                    </TableCell>
                    <TableCell>
                      {hasGrade ? (
                        <Badge variant={row.isAbsent ? "destructive" : "outline"}>
                          {row.isAbsent ? "AB" : gradeFor(percent)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.remarks}
                        onChange={(e) => setLocalRow(student.id, { remarks: e.target.value })}
                        placeholder="Optional"
                        className="w-40"
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {activeExamSubject ? (
        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 p-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:-mx-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {enteredCount}/{classStudents.length} entered - {activeSubjectName}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => persist()}>
                Save Draft
              </Button>
              <Button onClick={() => setSubmitOpen(true)}>Submit Final</Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit final marks?"
        description={`This locks in marks for ${activeSubjectName ?? "the selected subject"} - ${activeClassSection?.className ?? ""} ${activeClassSection?.section ?? ""}. You can still edit them later if needed.`}
        confirmLabel="Submit Final"
        onConfirm={() => {
          const ok = persist()
          if (!ok) return
          logActivity({
            action: "update",
            module: "Examinations",
            entityType: "Mark",
            entityId: examId,
            description: `Submitted final marks for ${activeSubjectName} in ${exam.name}`,
          })
          toast.success("Marks submitted")
          setSubmitOpen(false)
        }}
      />
    </div>
  )
}
