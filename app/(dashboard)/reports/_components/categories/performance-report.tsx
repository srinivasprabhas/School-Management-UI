"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { ChartCard } from "@/components/shared/chart-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useClassSections, useExams, useMarks, useStudents } from "@/lib/data/store/entities"
import { classSectionMatches, inDateRange, type ReportFilters } from "../report-utils"

interface PerformanceRow {
  id: string
  name: string
  className: string
  scores: Record<string, number>
  overall: number
}

const chartConfig: ChartConfig = { average: { label: "Average %", color: "var(--chart-2)" } }

/**
 * Category 5: Student Performance — average score trend across published/completed
 * exams (ordered by exam date), with a per-student pivot table of scores per exam.
 */
export function PerformanceReport({ filters }: { filters: ReportFilters }) {
  const { items: exams } = useExams()
  const { items: marks } = useMarks()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()

  const classSectionById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])

  const relevantExams = useMemo(
    () =>
      [...exams]
        .filter((e) => e.status === "published" || e.status === "completed")
        .filter((e) => inDateRange(e.startDate, filters))
        .sort((a, b) => (a.startDate < b.startDate ? -1 : 1)),
    [exams, filters]
  )

  const eligibleStudentIds = useMemo(
    () =>
      new Set(
        students
          .filter((s) => {
            const cs = classSectionById.get(s.classSectionId)
            return cs && classSectionMatches(cs, filters)
          })
          .map((s) => s.id)
      ),
    [students, classSectionById, filters]
  )

  const chartData = useMemo(
    () =>
      relevantExams.map((exam) => {
        const examMarks = marks.filter((m) => m.examId === exam.id && !m.isAbsent && eligibleStudentIds.has(m.studentId))
        const average = examMarks.length
          ? Math.round(examMarks.reduce((sum, m) => sum + m.marksObtained, 0) / examMarks.length)
          : 0
        return { exam: exam.name, average }
      }),
    [relevantExams, marks, eligibleStudentIds]
  )

  const rows = useMemo<PerformanceRow[]>(() => {
    const scoresByStudent = new Map<string, Record<string, number[]>>()
    relevantExams.forEach((exam) => {
      marks
        .filter((m) => m.examId === exam.id && !m.isAbsent && eligibleStudentIds.has(m.studentId))
        .forEach((m) => {
          const perExam = scoresByStudent.get(m.studentId) ?? {}
          const list = perExam[exam.id] ?? []
          list.push(m.marksObtained)
          perExam[exam.id] = list
          scoresByStudent.set(m.studentId, perExam)
        })
    })

    return [...scoresByStudent.entries()]
      .map(([studentId, perExam]) => {
        const student = students.find((s) => s.id === studentId)
        if (!student) return null
        const cs = classSectionById.get(student.classSectionId)
        const scores: Record<string, number> = {}
        let sum = 0
        let count = 0
        relevantExams.forEach((exam) => {
          const list = perExam[exam.id]
          if (list?.length) {
            const avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length)
            scores[exam.id] = avg
            sum += avg
            count += 1
          }
        })
        return {
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
          className: cs ? `${cs.className} ${cs.section}` : "—",
          scores,
          overall: count ? Math.round(sum / count) : 0,
        }
      })
      .filter((r): r is PerformanceRow => r !== null)
      .sort((a, b) => b.overall - a.overall)
  }, [relevantExams, marks, students, classSectionById, eligibleStudentIds])

  const columns = useMemo<ColumnDef<PerformanceRow>[]>(
    () => [
      { accessorKey: "name", header: "Student" },
      { accessorKey: "className", header: "Class" },
      ...relevantExams.map(
        (exam): ColumnDef<PerformanceRow> => ({
          id: exam.id,
          header: exam.name,
          cell: ({ row }) => (row.original.scores[exam.id] != null ? `${row.original.scores[exam.id]}%` : "—"),
        })
      ),
      { id: "overall", header: "Overall Avg", cell: ({ row }) => `${row.original.overall}%` },
    ],
    [relevantExams]
  )

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="Performance Trend" description="Average score across exams/terms" config={chartConfig}>
        <LineChart data={chartData} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="exam" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line dataKey="average" type="monotone" stroke="var(--color-average)" strokeWidth={2} dot />
        </LineChart>
      </ChartCard>
      <DataTable
        columns={columns}
        data={rows}
        searchKey="name"
        searchPlaceholder="Search by student…"
        emptyTitle="No performance data"
        emptyDescription="Try adjusting the filters above."
      />
    </div>
  )
}
