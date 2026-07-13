"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { BanknoteIcon, CheckIcon } from "lucide-react"

import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { useBookIssues, useBooks, useStudents, useTeachers } from "@/lib/data/store/entities"
import { formatCurrency } from "@/lib/format"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { Book, BookIssue } from "@/lib/data/types"

function buildFinesColumns(args: {
  booksById: Map<string, Book>
  borrowerNameById: Map<string, string>
  onMarkPaid: (issue: BookIssue) => void
  onWaive: (issue: BookIssue) => void
}): ColumnDef<BookIssue>[] {
  const actions: RowAction<BookIssue>[] = [
    { label: "Mark Paid", icon: CheckIcon, onSelect: args.onMarkPaid, hidden: (i) => i.status === "returned" },
    { label: "Waive", icon: BanknoteIcon, onSelect: args.onWaive, hidden: (i) => i.status === "returned" },
  ]

  return [
    {
      id: "borrower",
      accessorFn: (i) => args.borrowerNameById.get(i.borrowerId) ?? "Unknown",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Borrower" />,
    },
    {
      id: "book",
      accessorFn: (i) => args.booksById.get(i.bookId)?.title ?? "Unknown title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Book" />,
    },
    {
      id: "daysOverdue",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Days Overdue" />,
      cell: ({ row }) => {
        const due = new Date(row.original.dueDate)
        const diffDays = Math.max(0, Math.floor((SEED_TODAY.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
        return `${diffDays}d`
      },
    },
    {
      accessorKey: "fineAmount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fine Amount" />,
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
    },
    {
      id: "paid",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Paid" />,
      cell: ({ row }) =>
        row.original.status === "returned" ? (
          <StatusBadge label="Settled" tone="success" />
        ) : (
          <StatusBadge label="Unpaid" tone="destructive" />
        ),
    },
    createActionsColumn<BookIssue>(actions),
  ]
}

export function FinesPanel() {
  const { items: issues, update } = useBookIssues()
  const { items: books } = useBooks()
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()

  const [payingIssue, setPayingIssue] = useState<BookIssue | null>(null)
  const [waivingIssue, setWaivingIssue] = useState<BookIssue | null>(null)

  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const borrowerNameById = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((s) => map.set(s.id, `${s.firstName} ${s.lastName}`))
    teachers.forEach((t) => map.set(t.id, `${t.firstName} ${t.lastName}`))
    return map
  }, [students, teachers])

  const finedIssues = useMemo(() => issues.filter((i) => i.fineAmount > 0), [issues])

  const columns = useMemo(
    () =>
      buildFinesColumns({
        booksById,
        borrowerNameById,
        onMarkPaid: (issue) => setPayingIssue(issue),
        onWaive: (issue) => setWaivingIssue(issue),
      }),
    [booksById, borrowerNameById]
  )

  return (
    <div className="flex flex-col gap-4">
      {/*
        "Paid" is a display-only simplification derived from BookIssue.status —
        the data model has no dedicated paid flag on BookIssue.
      */}
      <DataTable
        columns={columns}
        data={finedIssues}
        searchKey="borrower"
        searchPlaceholder="Search by borrower…"
        emptyTitle="No outstanding fines"
        emptyDescription="No fines have been recorded."
      />

      <ConfirmDialog
        open={!!payingIssue}
        onOpenChange={(open) => !open && setPayingIssue(null)}
        title="Mark fine as paid?"
        description={`Record the ${formatCurrency(payingIssue?.fineAmount ?? 0)} fine as paid and clear the balance.`}
        confirmLabel="Mark Paid"
        onConfirm={() => {
          if (!payingIssue) return
          update(payingIssue.id, { fineAmount: 0 })
          toast.success("Fine marked as paid")
          setPayingIssue(null)
        }}
      />

      <ConfirmDialog
        open={!!waivingIssue}
        onOpenChange={(open) => !open && setWaivingIssue(null)}
        title="Waive this fine?"
        description={`This will clear the ${formatCurrency(waivingIssue?.fineAmount ?? 0)} fine without collecting payment.`}
        confirmLabel="Waive Fine"
        onConfirm={() => {
          if (!waivingIssue) return
          update(waivingIssue.id, { fineAmount: 0 })
          toast.success("Fine waived")
          setWaivingIssue(null)
        }}
      />
    </div>
  )
}
