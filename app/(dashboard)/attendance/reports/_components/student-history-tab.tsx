"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DownloadIcon, UserSearchIcon } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import type { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartCard } from "@/components/shared/chart-card"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate } from "@/lib/format"
import { useAttendance, useStudents } from "@/lib/data/store/entities"
import type { AttendanceRecord } from "@/lib/data/types"

const chartConfig: ChartConfig = {
  pct: { label: "Attendance %", color: "var(--chart-3)" },
}

interface StudentHistoryTabProps {
  classSectionIds: string[]
  dateFrom: string
  dateTo: string
}

export function StudentHistoryTab({ classSectionIds, dateFrom, dateTo }: StudentHistoryTabProps) {
  const { items: students } = useStudents()
  const { items: attendance } = useAttendance()

  const roster = useMemo(
    () => students.filter((s) => classSectionIds.includes(s.classSectionId)),
    [students, classSectionIds]
  )
  const [studentId, setStudentId] = useState(roster[0]?.id ?? "")
  const effectiveStudentId = roster.some((s) => s.id === studentId) ? studentId : (roster[0]?.id ?? "")
  const student = roster.find((s) => s.id === effectiveStudentId)

  const allRecords = useMemo(
    () => attendance.filter((a) => a.personId === effectiveStudentId && a.personType === "student"),
    [attendance, effectiveStudentId]
  )

  const trend = useMemo(() => {
    const byMonth = new Map<string, { present: number; total: number }>()
    allRecords.forEach((r) => {
      const key = r.date.slice(0, 7)
      const bucket = byMonth.get(key) ?? { present: 0, total: 0 }
      bucket.total += 1
      if (r.status === "present" || r.status === "late") bucket.present += 1
      byMonth.set(key, bucket)
    })
    return [...byMonth.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, v]) => {
        const [y, m] = key.split("-").map(Number)
        return {
          month: new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          pct: v.total ? Math.round((v.present / v.total) * 100) : 0,
        }
      })
  }, [allRecords])

  const filteredRecords = useMemo(
    () =>
      [...allRecords]
        .filter((r) => (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [allRecords, dateFrom, dateTo]
  )

  const columns: ColumnDef<AttendanceRecord>[] = [
    { accessorKey: "date", header: "Date", cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
    },
    { accessorKey: "markedBy", header: "Marked By" },
    { accessorKey: "remarks", header: "Remarks", cell: ({ getValue }) => getValue<string>() || "—" },
  ]

  if (roster.length === 0) {
    return (
      <EmptyState
        icon={UserSearchIcon}
        title="No students found"
        description="Adjust the class & section filters above."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Select value={effectiveStudentId} onValueChange={(v) => v && setStudentId(v)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select a student" />
        </SelectTrigger>
        <SelectContent>
          {roster.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.firstName} {s.lastName} — Roll No. {s.rollNo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ChartCard
        title="Attendance % Over Time"
        description={
          student ? `${student.firstName} ${student.lastName} — monthly attendance history` : "Monthly attendance history"
        }
        config={chartConfig}
      >
        <LineChart data={trend} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line dataKey="pct" type="monotone" stroke="var(--color-pct)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>

      <DataTable
        columns={columns}
        data={filteredRecords}
        toolbarActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success("Export started", {
                description: `Exporting ${filteredRecords.length} attendance records to Excel…`,
              })
            }
          >
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
        }
        emptyTitle="No records in range"
        emptyDescription="Try widening the date range filter."
      />
    </div>
  )
}
