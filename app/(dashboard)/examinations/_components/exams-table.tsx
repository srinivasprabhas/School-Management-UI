"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { useLogActivity } from "@/lib/data/audit"
import { useClassSections, useExamSubjects, useExams, useMarks } from "@/lib/data/store/entities"
import type { Exam } from "@/lib/data/types"
import { buildExamColumns } from "./columns"

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Published", value: "published" },
]

export function ExamsTable() {
  const router = useRouter()
  const { items: exams, update, remove: removeExam } = useExams()
  const { items: classSections } = useClassSections()
  const { items: examSubjects, removeMany: removeExamSubjects } = useExamSubjects()
  const { items: marks, removeMany: removeMarks } = useMarks()
  const logActivity = useLogActivity()

  const [publishingExam, setPublishingExam] = useState<Exam | null>(null)
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null)

  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])

  const columns = useMemo(
    () =>
      buildExamColumns({
        classSectionsById,
        onManageSubjects: (exam) => router.push(`/examinations/${exam.id}`),
        onEnterMarks: (exam) => router.push(`/examinations/${exam.id}/marks-entry`),
        onRankList: (exam) => router.push(`/examinations/${exam.id}/rank-list`),
        onReportCards: (exam) => router.push(`/examinations/${exam.id}/report-cards`),
        onPublish: (exam) => setPublishingExam(exam),
        onDelete: (exam) => setDeletingExam(exam),
      }),
    [classSectionsById, router]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Examinations"
        description={`${exams.length} exams configured.`}
        actions={
          <Button onClick={() => router.push("/examinations/new")}>
            <PlusIcon data-icon="inline-start" />
            Create Exam
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={exams}
        searchKey="name"
        searchPlaceholder="Search exams..."
        filters={[{ columnId: "status", title: "Status", options: STATUS_OPTIONS }]}
        onRowClick={(exam) => router.push(`/examinations/${exam.id}`)}
        emptyTitle="No exams found"
        emptyDescription="Create your first exam to get started."
      />

      <ConfirmDialog
        open={!!publishingExam}
        onOpenChange={(open) => !open && setPublishingExam(null)}
        title="Publish exam results?"
        description={`This marks "${publishingExam?.name}" as published, making results visible to parents and staff.`}
        confirmLabel="Publish"
        onConfirm={() => {
          if (!publishingExam) return
          update(publishingExam.id, { status: "published" })
          logActivity({
            action: "update",
            module: "Examinations",
            entityType: "Exam",
            entityId: publishingExam.id,
            description: `Published results for exam ${publishingExam.name}`,
          })
          toast.success("Exam published")
          setPublishingExam(null)
        }}
      />

      <ConfirmDialog
        open={!!deletingExam}
        onOpenChange={(open) => !open && setDeletingExam(null)}
        title="Delete exam?"
        description={`This will permanently remove "${deletingExam?.name}" along with its configured subjects and recorded marks. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingExam) return
          const relatedSubjectIds = examSubjects.filter((es) => es.examId === deletingExam.id).map((es) => es.id)
          if (relatedSubjectIds.length) removeExamSubjects(relatedSubjectIds)
          const relatedMarkIds = marks.filter((m) => m.examId === deletingExam.id).map((m) => m.id)
          if (relatedMarkIds.length) removeMarks(relatedMarkIds)
          removeExam(deletingExam.id)
          logActivity({
            action: "delete",
            module: "Examinations",
            entityType: "Exam",
            entityId: deletingExam.id,
            description: `Deleted exam ${deletingExam.name}`,
          })
          toast.success("Exam deleted")
          setDeletingExam(null)
        }}
      />
    </div>
  )
}
