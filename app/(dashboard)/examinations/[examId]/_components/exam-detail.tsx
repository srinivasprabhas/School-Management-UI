"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ClipboardListIcon,
  FileTextIcon,
  ListOrderedIcon,
  PencilLineIcon,
  SendIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/format"
import { useLogActivity } from "@/lib/data/audit"
import {
  useClassSections,
  useExamSubjects,
  useExams,
  useMarks,
  useSubjects,
} from "@/lib/data/store/entities"
import type { ClassSection, ExamSubject } from "@/lib/data/types"
import { ExamSubjectRowsEditor, type DraftExamSubjectRow } from "../../_components/exam-subject-rows-editor"

function toDraftRows(examSubjects: ExamSubject[]): DraftExamSubjectRow[] {
  return examSubjects.map((es) => ({
    rowId: es.id,
    id: es.id,
    classSectionId: es.classSectionId,
    subjectId: es.subjectId,
    examDate: es.examDate,
    startTime: es.startTime,
    durationMinutes: es.durationMinutes,
    maxMarks: es.maxMarks,
    passMarks: es.passMarks,
  }))
}

export function ExamDetail({ examId }: { examId: string }) {
  const { items: exams, update: updateExam } = useExams()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const {
    items: allExamSubjects,
    add: addExamSubject,
    update: updateExamSubject,
    removeMany: removeExamSubjects,
  } = useExamSubjects()
  const { items: marks } = useMarks()
  const logActivity = useLogActivity()

  const exam = exams.find((e) => e.id === examId)

  const examSubjectsForExam = useMemo(
    () => allExamSubjects.filter((es) => es.examId === examId),
    [allExamSubjects, examId]
  )

  const [rows, setRows] = useState<DraftExamSubjectRow[] | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)

  const activeRows = rows ?? toDraftRows(examSubjectsForExam)

  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])
  const examClassSections = useMemo(
    () =>
      exam
        ? exam.classSectionIds
            .map((id) => classSectionsById.get(id))
            .filter((cs): cs is ClassSection => !!cs)
        : [],
    [exam, classSectionsById]
  )

  const marksEnteredCount = useMemo(() => marks.filter((m) => m.examId === examId).length, [marks, examId])

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

  function handleSaveSubjects() {
    const invalid = activeRows.some((r) => !r.classSectionId || !r.subjectId || !r.examDate)
    if (invalid) {
      toast.error("Every subject row needs a class, subject, and exam date.")
      return
    }
    const existingIds = new Set(examSubjectsForExam.map((es) => es.id))
    const keptIds = new Set(activeRows.filter((r) => r.id).map((r) => r.id as string))
    const removedIds = [...existingIds].filter((id) => !keptIds.has(id))
    if (removedIds.length) removeExamSubjects(removedIds)

    activeRows.forEach((r) => {
      if (r.id) {
        updateExamSubject(r.id, {
          classSectionId: r.classSectionId,
          subjectId: r.subjectId,
          examDate: r.examDate,
          startTime: r.startTime,
          durationMinutes: r.durationMinutes,
          maxMarks: r.maxMarks,
          passMarks: r.passMarks,
        })
      } else {
        addExamSubject({
          id: `exsub_${examId}_${r.rowId}`,
          examId,
          classSectionId: r.classSectionId,
          subjectId: r.subjectId,
          examDate: r.examDate,
          startTime: r.startTime,
          durationMinutes: r.durationMinutes,
          maxMarks: r.maxMarks,
          passMarks: r.passMarks,
        })
      }
    })

    logActivity({
      action: "update",
      module: "Examinations",
      entityType: "Exam",
      entityId: examId,
      description: `Updated subjects for exam ${exam?.name}`,
    })
    toast.success("Exam subjects saved")
    setRows(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{exam.name}</h1>
            <StatusBadge label={exam.status} tone={toneForStatus(exam.status)} className="capitalize" />
          </div>
          <p className="text-sm text-muted-foreground">
            {exam.term} - {exam.academicYear}
          </p>
        </div>
        <Button
          disabled={exam.status === "published" || marksEnteredCount === 0}
          onClick={() => setPublishOpen(true)}
        >
          <SendIcon data-icon="inline-start" />
          {exam.status === "published" ? "Results Published" : "Publish All Results"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Date Range</p>
            <p>
              {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Term</p>
            <p>{exam.term}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Academic Year</p>
            <p>{exam.academicYear}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Marks Entered</p>
            <p>{marksEnteredCount}</p>
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-4">
            <p className="text-xs text-muted-foreground">Classes Included</p>
            <div className="flex flex-wrap gap-1">
              {examClassSections.map((cs) => (
                <Badge key={cs.id} variant="outline">
                  {cs.className} - {cs.section}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Configured Subjects</CardTitle>
          <Button size="sm" onClick={handleSaveSubjects}>
            Save Changes
          </Button>
        </CardHeader>
        <CardContent>
          <ExamSubjectRowsEditor
            rows={activeRows}
            onChange={setRows}
            classSections={examClassSections}
            subjects={subjects}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NavCard
          href={`/examinations/${examId}/marks-entry`}
          icon={PencilLineIcon}
          title="Marks Entry"
          description="Enter or edit student marks for this exam."
        />
        <NavCard
          href={`/examinations/${examId}/rank-list`}
          icon={ListOrderedIcon}
          title="Rank List"
          description="View class-wise rankings and pass/fail status."
        />
        <NavCard
          href={`/examinations/${examId}/report-cards`}
          icon={ClipboardListIcon}
          title="Report Cards"
          description="Preview and publish student report cards."
        />
      </div>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish all results?"
        description={`This marks "${exam.name}" as published. Report cards and rank lists become visible to parents and staff.`}
        confirmLabel="Publish"
        onConfirm={() => {
          updateExam(examId, { status: "published" })
          logActivity({
            action: "update",
            module: "Examinations",
            entityType: "Exam",
            entityId: examId,
            description: `Published results for exam ${exam.name}`,
          })
          toast.success("Results published")
          setPublishOpen(false)
        }}
      />
    </div>
  )
}

function NavCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col gap-2">
          <Icon className="size-5 text-primary" />
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
