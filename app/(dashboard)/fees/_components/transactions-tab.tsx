"use client"

import { useMemo } from "react"

import { DataTable } from "@/components/shared/data-table/data-table"
import { buildFeeTransactionColumns } from "./fee-transaction-columns"
import type { FeeTransaction, Student } from "@/lib/data/types"

interface TransactionsTabProps {
  transactions: FeeTransaction[]
  studentsById: Map<string, Student>
  onView: (tx: FeeTransaction) => void
  onPrint: (tx: FeeTransaction) => void
  onVoid: (tx: FeeTransaction) => void
}

export function TransactionsTab({ transactions, studentsById, onView, onPrint, onVoid }: TransactionsTabProps) {
  const columns = useMemo(
    () => buildFeeTransactionColumns({ studentsById, onView, onPrint, onVoid }),
    [studentsById, onView, onPrint, onVoid]
  )

  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const aDate = a.transactionDate ?? a.dueDate
        const bDate = b.transactionDate ?? b.dueDate
        return aDate < bDate ? 1 : -1
      }),
    [transactions]
  )

  return (
    <DataTable
      columns={columns}
      data={sorted}
      searchKey="studentName"
      searchPlaceholder="Search by student name…"
      filters={[
        {
          columnId: "status",
          title: "Status",
          options: [
            { label: "Paid", value: "paid" },
            { label: "Pending", value: "pending" },
            { label: "Overdue", value: "overdue" },
            { label: "Partial", value: "partial" },
          ],
        },
      ]}
      emptyTitle="No fee transactions"
      emptyDescription="Transactions recorded through fee collection will appear here."
    />
  )
}
