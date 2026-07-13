"use client"

import { useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeftIcon, DownloadIcon, FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import {
  useClassSections,
  useExamSubjects,
  useExams,
  useMarks,
  useStudents,
  useSubjects,
} from "@/lib/data/store/entities"
import { computeExamResults } from "../../_components/exam-results"
import { buildRankListColumns } from "./columns"

export function RankList({ examId }: { examId: string }) {
  const { items: exams } = useExams()
  const { items: examSubjects } = useExamSubjects()
  const { items: marks } = useMarks()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()

  const exam = exams.find((e) => e.id === examId)

  const { results, subjectColumns } = useMemo(
    () => computeExamResults({ examId, exams, examSubjects, marks, students, classSections, subjects }),
    [examId, exams, examSubjects, marks, students, classSections, subjects]
  )

  const columns = useMemo(() => buildRankListColumns(subjectColumns), [subjectColumns])

  const classFilterOptions = useMemo(() => {
    const seen = new Map<string, string>()
    results.forEach((r) => {
      const value = `${r.classSection.className} ${r.classSection.section}`
      seen.set(value, `${r.classSection.className} - ${r.classSection.section}`)
    })
    return [...seen.entries()].map(([value, label]) => ({ label, value }))
  }, [results])

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
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Rank List</h1>
        <p className="text-sm text-muted-foreground">
          {exam.name} - {exam.term}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={results}
        searchKey="student"
        searchPlaceholder="Search students..."
        filters={[{ columnId: "class", title: "Class", options: classFilterOptions }]}
        toolbarActions={
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Export started", { description: `Exporting rank list for ${exam.name}...` })
            }
          >
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
        }
        emptyTitle="No results yet"
        emptyDescription="Marks haven't been entered for this exam yet."
      />
    </div>
  )
}
