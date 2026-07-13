"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ColumnDef } from "@tanstack/react-table"

import { ChartCard } from "@/components/shared/chart-card"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { DataTable } from "@/components/shared/data-table/data-table"
import { useAttendance, useClassSections, useStudents } from "@/lib/data/store/entities"

const chartConfig: ChartConfig = {
  pct: { label: "Attendance %", color: "var(--chart-2)" },
}

interface Row {
  classSectionId: string
  name: string
  present: number
  absent: number
  pct: number
}

interface ClassWiseTabProps {
  classSectionIds: string[]
  dateFrom: string
  dateTo: string
}

export function ClassWiseTab({ classSectionIds, dateFrom, dateTo }: ClassWiseTabProps) {
  const router = useRouter()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const { items: attendance } = useAttendance()

  const rows: Row[] = useMemo(() => {
    const sections = classSections.filter((cs) => classSectionIds.includes(cs.id))
    return sections
      .map((section) => {
        const rosterIds = new Set(
          students.filter((s) => s.classSectionId === section.id && s.status === "active").map((s) => s.id)
        )
        const records = attendance.filter(
          (a) =>
            a.personType === "student" &&
            rosterIds.has(a.personId) &&
            (!dateFrom || a.date >= dateFrom) &&
            (!dateTo || a.date <= dateTo)
        )
        const present = records.filter((r) => r.status === "present" || r.status === "late").length
        const absent = records.filter((r) => r.status === "absent").length
        const pct = records.length ? Math.round((present / records.length) * 100) : 0
        return {
          classSectionId: section.id,
          name: `${section.className} - ${section.section}`,
          present,
          absent,
          pct,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [classSections, classSectionIds, students, attendance, dateFrom, dateTo])

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "name", header: "Class" },
    { accessorKey: "present", header: "Present" },
    { accessorKey: "absent", header: "Absent" },
    { accessorKey: "pct", header: "Attendance %", cell: ({ getValue }) => `${getValue<number>()}%` },
  ]

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        title="Class-wise Attendance"
        description="Average attendance % by class & section"
        config={chartConfig}
      >
        <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="pct" fill="var(--color-pct)" radius={4} />
        </BarChart>
      </ChartCard>

      <DataTable
        columns={columns}
        data={rows}
        onRowClick={(row) => router.push(`/attendance?classSectionId=${row.classSectionId}`)}
        emptyTitle="No classes found"
      />
    </div>
  )
}
