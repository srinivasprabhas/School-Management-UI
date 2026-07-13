"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartCard } from "@/components/shared/chart-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useAttendance, useClassSections, useTeachers } from "@/lib/data/store/entities"
import { classSectionMatches, inDateRange, type ReportFilters } from "../report-utils"

interface AttendanceRow {
  key: string
  label: string
  present: number
  absent: number
  total: number
  pct: number
}

function toRows(buckets: Map<string, { present: number; absent: number; total: number }>): AttendanceRow[] {
  return [...buckets.entries()]
    .map(([key, b]) => ({
      key,
      label: key,
      present: b.present,
      absent: b.absent,
      total: b.total,
      pct: b.total ? Math.round((b.present / b.total) * 100) : 0,
    }))
    .filter((r) => r.total > 0)
}

function buildColumns(groupLabel: string): ColumnDef<AttendanceRow>[] {
  return [
    { accessorKey: "label", header: groupLabel },
    { accessorKey: "present", header: "Present" },
    { accessorKey: "absent", header: "Absent" },
    { id: "pct", header: "Attendance %", cell: ({ row }) => `${row.original.pct}%` },
  ]
}

/** Category 1: Attendance — student attendance grouped by class section. */
export function AttendanceReport({ filters }: { filters: ReportFilters }) {
  const { items: attendance } = useAttendance()
  const { items: classSections } = useClassSections()

  const rows = useMemo(() => {
    const relevantSections = classSections.filter((cs) => classSectionMatches(cs, filters))
    const byClass = new Map<string, { present: number; absent: number; total: number }>()
    relevantSections.forEach((cs) => byClass.set(`${cs.className} ${cs.section}`, { present: 0, absent: 0, total: 0 }))
    const sectionLabel = new Map(relevantSections.map((cs) => [cs.id, `${cs.className} ${cs.section}`]))

    attendance
      .filter((a) => a.personType === "student" && a.classSectionId && sectionLabel.has(a.classSectionId))
      .filter((a) => inDateRange(a.date, filters))
      .forEach((a) => {
        const label = sectionLabel.get(a.classSectionId!)!
        const bucket = byClass.get(label)!
        bucket.total += 1
        if (a.status === "present" || a.status === "late") bucket.present += 1
        else if (a.status === "absent") bucket.absent += 1
      })

    return toRows(byClass)
  }, [attendance, classSections, filters])

  const chartConfig: ChartConfig = { pct: { label: "Attendance %", color: "var(--chart-2)" } }

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        title="Attendance by Class"
        description="Average attendance percentage per class"
        config={chartConfig}
      >
        <BarChart data={rows} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="pct" fill="var(--color-pct)" radius={4} />
        </BarChart>
      </ChartCard>
      <DataTable
        columns={buildColumns("Class")}
        data={rows}
        emptyTitle="No attendance data"
        emptyDescription="Try adjusting the filters above."
      />
    </div>
  )
}

/**
 * Category 8: Teacher Attendance — same shape as student Attendance, grouped by
 * department instead of class. The class/section filters don't apply to staff
 * records, so only the date range narrows this report.
 */
export function TeacherAttendanceReport({ filters }: { filters: ReportFilters }) {
  const { items: attendance } = useAttendance()
  const { items: teachers } = useTeachers()

  const rows = useMemo(() => {
    const teacherDept = new Map(teachers.map((t) => [t.id, t.department]))
    const byDept = new Map<string, { present: number; absent: number; total: number }>()

    attendance
      .filter((a) => a.personType === "staff" && teacherDept.has(a.personId))
      .filter((a) => inDateRange(a.date, filters))
      .forEach((a) => {
        const dept = teacherDept.get(a.personId)!
        const bucket = byDept.get(dept) ?? { present: 0, absent: 0, total: 0 }
        bucket.total += 1
        if (a.status === "present" || a.status === "late") bucket.present += 1
        else if (a.status === "absent") bucket.absent += 1
        byDept.set(dept, bucket)
      })

    return toRows(byDept)
  }, [attendance, teachers, filters])

  const chartConfig: ChartConfig = { pct: { label: "Attendance %", color: "var(--chart-1)" } }

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        title="Staff Attendance by Department"
        description="Average attendance percentage per department"
        config={chartConfig}
      >
        <BarChart data={rows} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="pct" fill="var(--color-pct)" radius={4} />
        </BarChart>
      </ChartCard>
      <DataTable
        columns={buildColumns("Department")}
        data={rows}
        emptyTitle="No attendance data"
        emptyDescription="Try adjusting the filters above."
      />
    </div>
  )
}
