"use client"

import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { buildFeeTransactionColumns } from "./fee-transaction-columns"
import type { FeeTransaction, Student } from "@/lib/data/types"

interface OverviewTabProps {
  transactions: FeeTransaction[]
  studentsById: Map<string, Student>
  onView: (tx: FeeTransaction) => void
  onPrint: (tx: FeeTransaction) => void
  onVoid: (tx: FeeTransaction) => void
}

export function OverviewTab({ transactions, studentsById, onView, onPrint, onVoid }: OverviewTabProps) {
  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .filter((tx) => tx.transactionDate)
        .sort((a, b) => ((a.transactionDate ?? "") < (b.transactionDate ?? "") ? 1 : -1))
        .slice(0, 5),
    [transactions]
  )

  const columns = useMemo(
    () => buildFeeTransactionColumns({ studentsById, onView, onPrint, onVoid }),
    [studentsById, onView, onPrint, onVoid]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>The last 5 fee payments recorded, most recent first.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={recentTransactions}
          emptyTitle="No recent transactions"
          emptyDescription="Payments collected will show up here."
        />
      </CardContent>
    </Card>
  )
}
