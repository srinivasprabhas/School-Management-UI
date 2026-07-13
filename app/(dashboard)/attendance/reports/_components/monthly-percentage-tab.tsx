"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ColumnDef } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { ChartCard } from "@/components/shared/chart-card"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { useAttendance, useClassSections, useStudents } from "@/lib/data/store/entities"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { toISODate } from "@/lib/data/seed/random"

const chartConfig: ChartConfig = {
  pct: { label: "Attendance %", color: "var(--chart-1)" },
}

interface Row {
  key: string
  name: string
  present: number
  absent: number
  pct: number
}

export function MonthlyPercentageTab({ classSectionIds }: { classSectionIds: string[] }) {
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const { items: attendance } = useAttendance()
  const [month, setMonth] = useState(toISODate(SEED_TODAY).slice(0, 7))

  const roster = useMemo(
    () => students.filter((s) => classSectionIds.includes(s.classSectionId) && s.status === "active"),
    [students, classSectionIds]
  )

  const byStudent = classSectionIds.length === 1

  const rows: Row[] = useMemo(() => {
    const rosterIds = new Set(roster.map((s) => s.id))
    const monthAttendance = attendance.filter(
      (a) => a.personType === "student" && a.date.startsWith(month) && rosterIds.has(a.personId)
    )

    if (byStudent) {
      return roster.map((s) => {
        const records = monthAttendance.filter((a) => a.personId === s.id)
        const present = records.filter((r) => r.status === "present" || r.status === "late").length
        const absent = records.filter((r) => r.status === "absent").length
        const pct = records.length ? Math.round((present / records.length) * 100) : 0
        return { key: s.id, name: `${s.firstName} ${s.lastName}`, present, absent, pct }
      })
    }

    const byClass = new Map<string, { present: number; absent: number; total: number }>()
    monthAttendance.forEach((a) => {
      const student = roster.find((s) => s.id === a.personId)
      const section = classSections.find((cs) => cs.id === student?.classSectionId)
      const label = section ? `${section.className} - ${section.section}` : "Unknown"
      const bucket = byClass.get(label) ?? { present: 0, absent: 0, total: 0 }
      bucket.total += 1
      if (a.status === "present" || a.status === "late") bucket.present += 1
      if (a.status === "absent") bucket.absent += 1
      byClass.set(label, bucket)
    })
    return [...byClass.entries()].map(([label, v]) => ({
      key: label,
      name: label,
      present: v.present,
      absent: v.absent,
      pct: v.total ? Math.round((v.present / v.total) * 100) : 0,
    }))
  }, [attendance, month, roster, byStudent, classSections])

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title={byStudent ? "Student" : "Class"} />,
    },
    { accessorKey: "present", header: "Present" },
    { accessorKey: "absent", header: "Absent" },
    { accessorKey: "pct", header: "Attendance %", cell: ({ getValue }) => `${getValue<number>()}%` },
  ]

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        title="Monthly Attendance Percentage"
        description={
          byStudent ? "% present per student for the selected month" : "% present per class for the selected month"
        }
        config={chartConfig}
        actions={
          <Input
            type="month"
            className="w-40"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        }
      >
        <BarChart data={rows} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={60}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="pct" fill="var(--color-pct)" radius={4} />
        </BarChart>
      </ChartCard>

      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No attendance data"
        emptyDescription="No records found for the selected month and filters."
      />
    </div>
  )
}
