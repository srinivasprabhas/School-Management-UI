"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { BellIcon, RefreshCwIcon, Undo2Icon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { useBookIssues, useBooks, useStudents, useTeachers } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { initials, formatDate } from "@/lib/format"
import { addDays, toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { Book, BookIssue } from "@/lib/data/types"

interface BorrowerInfo {
  name: string
  role: "Student" | "Staff"
}

function buildCirculationColumns(args: {
  booksById: Map<string, Book>
  borrowerById: Map<string, BorrowerInfo>
  onReturn: (issue: BookIssue) => void
  onRenew: (issue: BookIssue) => void
  onRemind: (issue: BookIssue) => void
}): ColumnDef<BookIssue>[] {
  const actions: RowAction<BookIssue>[] = [
    { label: "Return", icon: Undo2Icon, onSelect: args.onReturn },
    { label: "Renew", icon: RefreshCwIcon, onSelect: args.onRenew },
    { label: "Send Reminder", icon: BellIcon, onSelect: args.onRemind },
  ]

  return [
    {
      id: "book",
      accessorFn: (i) => args.booksById.get(i.bookId)?.title ?? "Unknown title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Book" />,
    },
    {
      id: "borrower",
      accessorFn: (i) => args.borrowerById.get(i.borrowerId)?.name ?? "Unknown",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Borrower" />,
      cell: ({ row }) => {
        const borrower = args.borrowerById.get(row.original.borrowerId)
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(borrower?.name ?? "?")}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span>{borrower?.name ?? "Unknown"}</span>
              <Badge variant="outline" className="w-fit text-[10px]">
                {borrower?.role ?? "Staff"}
              </Badge>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Issue Date" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: "daysOverdue",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Days Overdue" />,
      cell: ({ row }) => {
        const due = new Date(row.original.dueDate)
        const diffDays = Math.floor((SEED_TODAY.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? (
          <span className="font-medium text-destructive">{diffDays}d</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
    },
    createActionsColumn<BookIssue>(actions),
  ]
}

export function CirculationPanel() {
  const { items: issues, update } = useBookIssues()
  const { items: books, update: updateBook } = useBooks()
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const logActivity = useLogActivity()

  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const borrowerById = useMemo(() => {
    const map = new Map<string, BorrowerInfo>()
    students.forEach((s) => map.set(s.id, { name: `${s.firstName} ${s.lastName}`, role: "Student" }))
    teachers.forEach((t) => map.set(t.id, { name: `${t.firstName} ${t.lastName}`, role: "Staff" }))
    return map
  }, [students, teachers])

  const activeIssues = useMemo(() => issues.filter((i) => i.status !== "returned"), [issues])

  const columns = useMemo(
    () =>
      buildCirculationColumns({
        booksById,
        borrowerById,
        onReturn: (issue) => {
          update(issue.id, { status: "returned", returnDate: toISODate(SEED_TODAY) })
          const book = booksById.get(issue.bookId)
          if (book) updateBook(book.id, { availableCopies: Math.min(book.totalCopies, book.availableCopies + 1) })
          logActivity({
            action: "update",
            module: "Library",
            entityType: "BookIssue",
            entityId: issue.id,
            description: `Returned "${book?.title ?? issue.bookId}"`,
          })
          toast.success("Book returned")
        },
        onRenew: (issue) => {
          update(issue.id, { dueDate: toISODate(addDays(new Date(issue.dueDate), 7)) })
          toast.success("Due date extended by 7 days")
        },
        onRemind: (issue) => {
          const borrower = borrowerById.get(issue.borrowerId)
          toast.success("Reminder sent", { description: `Notified ${borrower?.name ?? "borrower"}.` })
        },
      }),
    [booksById, borrowerById, update, updateBook, logActivity]
  )

  return (
    <DataTable
      columns={columns}
      data={activeIssues}
      searchKey="borrower"
      searchPlaceholder="Search by borrower…"
      emptyTitle="No active issues"
      emptyDescription="All books are currently checked in."
    />
  )
}
