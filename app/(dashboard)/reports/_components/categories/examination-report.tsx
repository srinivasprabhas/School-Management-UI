"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { FileTextIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartCard } from "@/components/shared/chart-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { gradeFor } from "@/lib/data/seed/generate"
import { useClassSections, useExams, useMarks, useStudents } from "@/lib/data/store/entities"
import { classSectionMatches, type ReportFilters } from "../report-utils"

interface ExamResultRow {
  id: string
  name: string
  className: string
  obtained: number
  max: number
  pct: number
  grade: string
}

const columns: ColumnDef<ExamResultRow>[] = [
  { accessorKey: "name", header: "Student" },
  { accessorKey: "className", header: "Class" },
  { accessorKey: "obtained", header: "Marks Obtained" },
  { accessorKey: "max", header: "Max Marks" },
  { id: "pct", header: "Percentage", cell: ({ row }) => `${row.original.pct}%` },
  { accessorKey: "grade", header: "Grade" },
]

const chartConfig: ChartConfig = {
  excellent: { label: "Excellent (80-100%)", color: "var(--chart-2)" },
  good: { label: "Good (60-79%)", color: "var(--chart-1)" },
  average: { label: "Average (40-59%)", color: "var(--chart-3)" },
  needsImprovement: { label: "Needs Improvement (<40%)", color: "var(--chart-5)" },
}

/**
 * Category 3: Examination — reuses the Dashboard's grade-band bucketing
 * (excellent/good/average/needsImprovement) for the latest published exam, and
 * lists per-student results for that same exam below.
 */
export function ExaminationReport({ filters }: { filters: ReportFilters }) {
  const { items: exams } = useExams()
  const { items: marks } = useMarks()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()

  const classSectionById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])

  const latestExam = useMemo(
    () =>
      [...exams]
        .filter((e) => e.status === "published" || e.status === "completed")
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0],
    [exams]
  )

  const chartData = useMemo(() => {
    if (!latestExam) return []
    const examMarks = marks.filter((m) => m.examId === latestExam.id && !m.isAbsent)
    const byStudent = new Map<string, number[]>()
    examMarks.forEach((m) => {
      const list = byStudent.get(m.studentId) ?? []
      list.push(m.marksObtained)
      byStudent.set(m.studentId, list)
    })

    const byClass = new Map<
      string,
      { excellent: number; good: number; average: number; needsImprovement: number }
    >()
    byStudent.forEach((scores, studentId) => {
      const student = students.find((s) => s.id === studentId)
      const cs = student ? classSectionById.get(student.classSectionId) : undefined
      if (!cs || !classSectionMatches(cs, filters)) return
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      const bucket = byClass.get(cs.className) ?? { excellent: 0, good: 0, average: 0, needsImprovement: 0 }
      if (avg >= 80) bucket.excellent += 1
      else if (avg >= 60) bucket.good += 1
      else if (avg >= 40) bucket.average += 1
      else bucket.needsImprovement += 1
      byClass.set(cs.className, bucket)
    })

    return [...byClass.entries()].map(([className, v]) => ({ className, ...v }))
  }, [latestExam, marks, students, classSectionById, filters])

  const rows = useMemo<ExamResultRow[]>(() => {
    if (!latestExam) return []
    const examMarks = marks.filter((m) => m.examId === latestExam.id)
    const byStudent = new Map<string, { obtained: number; max: number }>()
    examMarks.forEach((m) => {
      const entry = byStudent.get(m.studentId) ?? { obtained: 0, max: 0 }
      entry.obtained += m.isAbsent ? 0 : m.marksObtained
      entry.max += 100
      byStudent.set(m.studentId, entry)
    })

    return [...byStudent.entries()]
      .map(([studentId, v]) => {
        const student = students.find((s) => s.id === studentId)
        const cs = student ? classSectionById.get(student.classSectionId) : undefined
        if (!student || !cs || !classSectionMatches(cs, filters)) return null
        const pct = v.max ? Math.round((v.obtained / v.max) * 100) : 0
        return {
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
          className: `${cs.className} ${cs.section}`,
          obtained: v.obtained,
          max: v.max,
          pct,
          grade: gradeFor(pct),
        }
      })
      .filter((r): r is ExamResultRow => r !== null)
      .sort((a, b) => b.pct - a.pct)
  }, [latestExam, marks, students, classSectionById, filters])

  if (!latestExam) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="No published exam yet"
        description="Publish an exam under Examinations to see results here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        title="Exam Performance"
        description={`${latestExam.name} — grade distribution by class`}
        config={chartConfig}
      >
        <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="className" tickLine={false} axisLine={false} width={70} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="excellent" stackId="perf" fill="var(--color-excellent)" radius={[4, 0, 0, 4]} />
          <Bar dataKey="good" stackId="perf" fill="var(--color-good)" />
          <Bar dataKey="average" stackId="perf" fill="var(--color-average)" />
          <Bar dataKey="needsImprovement" stackId="perf" fill="var(--color-needsImprovement)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>
      <DataTable
        columns={columns}
        data={rows}
        searchKey="name"
        searchPlaceholder="Search by student…"
        emptyTitle="No results found"
        emptyDescription="Try adjusting the filters above."
      />
    </div>
  )
}
