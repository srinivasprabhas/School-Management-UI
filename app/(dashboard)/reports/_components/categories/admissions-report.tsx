"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartCard } from "@/components/shared/chart-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatDate } from "@/lib/format"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { useClassSections, useStudents } from "@/lib/data/store/entities"
import { classSectionMatches, inDateRange, monthKeyFromDate, type ReportFilters } from "../report-utils"

interface AdmissionRow {
  id: string
  admissionNo: string
  name: string
  className: string
  admissionDate: string
  status: string
}

const columns: ColumnDef<AdmissionRow>[] = [
  { accessorKey: "admissionNo", header: "Admission No." },
  { accessorKey: "name", header: "Student" },
  { accessorKey: "className", header: "Class" },
  { id: "admissionDate", header: "Admission Date", cell: ({ row }) => formatDate(row.original.admissionDate) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge label={row.original.status} tone={toneForStatus(row.original.status)} className="capitalize" />
    ),
  },
]

const chartConfig: ChartConfig = { admissions: { label: "New Admissions", color: "var(--chart-1)" } }

/**
 * Category 4: Admissions — new admissions per month, derived from Student.admissionDate
 * (enrolled students), not useAdmissionLeads() pipeline stages. The class/section filter
 * bar maps cleanly onto enrolled students, and this mirrors the Dashboard's admission
 * chart; a lead-funnel view could be added separately for the front-office pipeline.
 */
export function AdmissionsReport({ filters }: { filters: ReportFilters }) {
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const classSectionById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        const cs = classSectionById.get(s.classSectionId)
        if (!cs || !classSectionMatches(cs, filters)) return false
        return inDateRange(s.admissionDate, filters)
      }),
    [students, classSectionById, filters]
  )

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>()
    if (!filters.dateFrom && !filters.dateTo) {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
        buckets.set(monthKeyFromDate(d), 0)
      }
    }
    filteredStudents.forEach((s) => {
      const key = monthKeyFromDate(new Date(s.admissionDate))
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    })
    return [...buckets.entries()].map(([month, admissions]) => ({ month, admissions }))
  }, [filteredStudents, filters])

  const rows = useMemo<AdmissionRow[]>(
    () =>
      [...filteredStudents]
        .sort((a, b) => (a.admissionDate < b.admissionDate ? 1 : -1))
        .map((s) => {
          const cs = classSectionById.get(s.classSectionId)
          return {
            id: s.id,
            admissionNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            className: cs ? `${cs.className} ${cs.section}` : "—",
            admissionDate: s.admissionDate,
            status: s.status,
          }
        }),
    [filteredStudents, classSectionById]
  )

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="New Admissions" description="Enrolled students by month" config={chartConfig}>
        <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="admissions" fill="var(--color-admissions)" radius={4} />
        </BarChart>
      </ChartCard>
      <DataTable
        columns={columns}
        data={rows}
        searchKey="name"
        searchPlaceholder="Search by student…"
        emptyTitle="No admissions found"
        emptyDescription="Try adjusting the filters above."
      />
    </div>
  )
}
