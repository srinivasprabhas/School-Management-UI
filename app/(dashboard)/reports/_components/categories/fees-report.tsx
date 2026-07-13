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
import { useClassSections, useFeeTransactions, useStudents } from "@/lib/data/store/entities"
import type { FeeTransaction } from "@/lib/data/types"
import { classSectionMatches, inDateRange, monthKey, monthKeyFromDate, type ReportFilters } from "../report-utils"

interface FeeRow {
  id: string
  receiptNo: string
  studentName: string
  className: string
  amount: number
  paid: number
  balance: number
  status: FeeTransaction["status"]
  dueDate: string
}

const columns: ColumnDef<FeeRow>[] = [
  { accessorKey: "receiptNo", header: "Receipt No." },
  { accessorKey: "studentName", header: "Student" },
  { accessorKey: "className", header: "Class" },
  { id: "amount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.amount) },
  { id: "paid", header: "Paid", cell: ({ row }) => formatCurrency(row.original.paid) },
  { id: "balance", header: "Balance", cell: ({ row }) => formatCurrency(row.original.balance) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge label={row.original.status} tone={toneForStatus(row.original.status)} className="capitalize" />
    ),
  },
  { id: "dueDate", header: "Due Date", cell: ({ row }) => formatDate(row.original.dueDate) },
]

const chartConfig: ChartConfig = {
  collected: { label: "Collected", color: "var(--chart-2)" },
  pending: { label: "Pending", color: "var(--chart-3)" },
}

/** Category 2: Fees — collected vs. pending by month, mirroring the Dashboard's fee chart. */
export function FeesReport({ filters }: { filters: ReportFilters }) {
  const { items: transactions } = useFeeTransactions()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()

  const studentClassSection = useMemo(() => new Map(students.map((s) => [s.id, s.classSectionId])), [students])
  const classSectionById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])

  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      const csId = studentClassSection.get(tx.studentId)
      const cs = csId ? classSectionById.get(csId) : undefined
      if (!cs || !classSectionMatches(cs, filters)) return false
      return inDateRange(tx.dueDate, filters)
    })
  }, [transactions, studentClassSection, classSectionById, filters])

  const chartData = useMemo(() => {
    const buckets = new Map<string, { collected: number; pending: number }>()
    if (!filters.dateFrom && !filters.dateTo) {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
        buckets.set(monthKeyFromDate(d), { collected: 0, pending: 0 })
      }
    }
    filteredTx.forEach((tx) => {
      const key = monthKey(tx.dueDate)
      const bucket = buckets.get(key) ?? { collected: 0, pending: 0 }
      if (tx.status === "paid") bucket.collected += tx.paidAmount
      else bucket.pending += tx.balance
      buckets.set(key, bucket)
    })
    return [...buckets.entries()].map(([month, v]) => ({ month, ...v }))
  }, [filteredTx, filters])

  const rows = useMemo<FeeRow[]>(
    () =>
      filteredTx.map((tx) => {
        const student = students.find((s) => s.id === tx.studentId)
        const cs = student ? classSectionById.get(student.classSectionId) : undefined
        return {
          id: tx.id,
          receiptNo: tx.receiptNo || "—",
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          className: cs ? `${cs.className} ${cs.section}` : "—",
          amount: tx.totalAmount,
          paid: tx.paidAmount,
          balance: tx.balance,
          status: tx.status,
          dueDate: tx.dueDate,
        }
      }),
    [filteredTx, students, classSectionById]
  )

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="Fee Collection" description="Collected vs. pending, by month" config={chartConfig}>
        <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="collected" stackId="fees" fill="var(--color-collected)" radius={[0, 0, 4, 4]} />
          <Bar dataKey="pending" stackId="fees" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
      <DataTable
        columns={columns}
        data={rows}
        searchKey="studentName"
        searchPlaceholder="Search by student…"
        emptyTitle="No transactions found"
        emptyDescription="Try adjusting the filters above."
      />
    </div>
  )
}
