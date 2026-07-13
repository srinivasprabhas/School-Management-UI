"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeftIcon, FileTextIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { useLogActivity } from "@/lib/data/audit"
import {
  useClassSections,
  useExamSubjects,
  useExams,
  useMarks,
  useStudents,
  useSubjects,
} from "@/lib/data/store/entities"
import { computeExamResults, type StudentExamResult } from "../../_components/exam-results"
import { buildReportCardColumns } from "./columns"
import { ReportCardPreview } from "./report-card-preview"

type PublishTarget = StudentExamResult | "bulk" | null

export function ReportCards({ examId }: { examId: string }) {
  const { items: exams, update: updateExam } = useExams()
  const { items: examSubjects } = useExamSubjects()
  const { items: marks } = useMarks()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const logActivity = useLogActivity()

  const exam = exams.find((e) => e.id === examId)

  const { results } = useMemo(
    () => computeExamResults({ examId, exams, examSubjects, marks, students, classSections, subjects }),
    [examId, exams, examSubjects, marks, students, classSections, subjects]
  )

  const [selected, setSelected] = useState<StudentExamResult[]>([])
  const [previewResult, setPreviewResult] = useState<StudentExamResult | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState<PublishTarget>(null)

  const isPublished = exam?.status === "published"

  const columns = useMemo(
    () =>
      buildReportCardColumns({
        isPublished: !!isPublished,
        onPreview: (r) => setPreviewResult(r),
        onPublish: (r) => {
          setPublishTarget(r)
          setPublishOpen(true)
        },
      }),
    [isPublished]
  )

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

  function confirmPublish() {
    updateExam(examId, { status: "published" })
    logActivity({
      action: "update",
      module: "Examinations",
      entityType: "Exam",
      entityId: examId,
      description:
        publishTarget === "bulk"
          ? `Published report cards for ${selected.length} student(s) in exam ${exam?.name}`
          : `Published report card for ${(publishTarget as StudentExamResult | null)?.student.firstName ?? ""} ${
              (publishTarget as StudentExamResult | null)?.student.lastName ?? ""
            } in exam ${exam?.name}`,
    })
    toast.success("Results published")
    setPublishOpen(false)
    setPublishTarget(null)
    setSelected([])
  }

  return (
    <div className="flex flex-col gap-6">
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
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Report Cards</h1>
        <p className="text-sm text-muted-foreground">
          {exam.name} - {exam.term}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={results}
        searchKey="student"
        searchPlaceholder="Search students..."
        onSelectionChange={setSelected}
        toolbarActions={
          <Button
            variant="outline"
            disabled={selected.length === 0 || isPublished}
            onClick={() => {
              setPublishTarget("bulk")
              setPublishOpen(true)
            }}
          >
            <SendIcon data-icon="inline-start" />
            Publish Selected ({selected.length})
          </Button>
        }
        emptyTitle="No report cards yet"
        emptyDescription="Marks haven't been entered for this exam yet."
      />

      {previewResult ? (
        <ReportCardPreview
          open={!!previewResult}
          onOpenChange={(open) => !open && setPreviewResult(null)}
          exam={exam}
          result={previewResult}
        />
      ) : null}

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={(open) => {
          setPublishOpen(open)
          if (!open) setPublishTarget(null)
        }}
        title="Publish report card results?"
        description={
          publishTarget === "bulk"
            ? `This will publish results for the exam, making ${selected.length} selected student(s)' report cards visible to parents.`
            : "This will publish results for the exam, making this report card visible to parents."
        }
        confirmLabel="Publish"
        onConfirm={confirmPublish}
      />
    </div>
  )
}
