"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartCard } from "@/components/shared/chart-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCurrency, formatDate } from "@/lib/format"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { useBookIssues, useBooks, useStudents, useTeachers } from "@/lib/data/store/entities"
import { inDateRange, monthKeyFromDate, type ReportFilters } from "../report-utils"

interface IssueRow {
  id: string
  bookTitle: string
  borrowerName: string
  borrowerType: string
  issueDate: string
  dueDate: string
  status: string
  fineAmount: number
}

const columns: ColumnDef<IssueRow>[] = [
  { accessorKey: "bookTitle", header: "Book" },
  { accessorKey: "borrowerName", header: "Borrower" },
  {
    accessorKey: "borrowerType",
    header: "Type",
    cell: ({ row }) => <span className="capitalize">{row.original.borrowerType}</span>,
  },
  { id: "issueDate", header: "Issue Date", cell: ({ row }) => formatDate(row.original.issueDate) },
  { id: "dueDate", header: "Due Date", cell: ({ row }) => formatDate(row.original.dueDate) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge label={row.original.status} tone={toneForStatus(row.original.status)} className="capitalize" />
    ),
  },
  {
    id: "fineAmount",
    header: "Fine",
    cell: ({ row }) => (row.original.fineAmount ? formatCurrency(row.original.fineAmount) : "—"),
  },
]

const chartConfig: ChartConfig = {
  issued: { label: "Issued", color: "var(--chart-1)" },
  returned: { label: "Returned", color: "var(--chart-2)" },
}

/**
 * Category 7: Library — minimal read-only consumption of useBookIssues()/useBooks().
 * No Library CRUD is built here (owned by the Library module). Borrowers include staff,
 * so the class/section filter doesn't narrow this report; only the date range (on issue
 * date) applies.
 */
export function LibraryReport({ filters }: { filters: ReportFilters }) {
  const { items: bookIssues } = useBookIssues()
  const { items: books } = useBooks()
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()

  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])
  const teacherById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])

  const filteredIssues = useMemo(
    () => bookIssues.filter((iss) => inDateRange(iss.issueDate, filters)),
    [bookIssues, filters]
  )

  const chartData = useMemo(() => {
    const buckets = new Map<string, { issued: number; returned: number }>()
    if (!filters.dateFrom && !filters.dateTo) {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
        buckets.set(monthKeyFromDate(d), { issued: 0, returned: 0 })
      }
    }
    filteredIssues.forEach((iss) => {
      const issuedKey = monthKeyFromDate(new Date(iss.issueDate))
      const issuedBucket = buckets.get(issuedKey) ?? { issued: 0, returned: 0 }
      issuedBucket.issued += 1
      buckets.set(issuedKey, issuedBucket)
      if (iss.returnDate) {
        const returnedKey = monthKeyFromDate(new Date(iss.returnDate))
        const returnedBucket = buckets.get(returnedKey) ?? { issued: 0, returned: 0 }
        returnedBucket.returned += 1
        buckets.set(returnedKey, returnedBucket)
      }
    })
    return [...buckets.entries()].map(([month, v]) => ({ month, ...v }))
  }, [filteredIssues, filters])

  const rows = useMemo<IssueRow[]>(
    () =>
      filteredIssues.map((iss) => {
        const borrowerName =
          iss.borrowerType === "staff"
            ? (() => {
                const t = teacherById.get(iss.borrowerId)
                return t ? `${t.firstName} ${t.lastName}` : "Unknown"
              })()
            : (() => {
                const s = studentById.get(iss.borrowerId)
                return s ? `${s.firstName} ${s.lastName}` : "Unknown"
              })()
        return {
          id: iss.id,
          bookTitle: bookById.get(iss.bookId)?.title ?? "Unknown",
          borrowerName,
          borrowerType: iss.borrowerType,
          issueDate: iss.issueDate,
          dueDate: iss.dueDate,
          status: iss.status,
          fineAmount: iss.fineAmount,
        }
      }),
    [filteredIssues, bookById, studentById, teacherById]
  )

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="Books Issued vs. Returned" description="Monthly library activity" config={chartConfig}>
        <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="issued" fill="var(--color-issued)" radius={4} />
          <Bar dataKey="returned" fill="var(--color-returned)" radius={4} />
        </BarChart>
      </ChartCard>
      <DataTable
        columns={columns}
        data={rows}
        searchKey="bookTitle"
        searchPlaceholder="Search by book…"
        emptyTitle="No issues found"
        emptyDescription="Try adjusting the filters above."
      />
    </div>
  )
}
