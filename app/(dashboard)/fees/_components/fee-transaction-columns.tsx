"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { EyeIcon, PrinterIcon, XCircleIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatCurrency, formatDate, initials } from "@/lib/format"
import type { FeeTransaction, Student } from "@/lib/data/types"

interface BuildFeeTransactionColumnsArgs {
  studentsById: Map<string, Student>
  onView: (tx: FeeTransaction) => void
  onPrint: (tx: FeeTransaction) => void
  onVoid: (tx: FeeTransaction) => void
}

export function buildFeeTransactionColumns({
  studentsById,
  onView,
  onPrint,
  onVoid,
}: BuildFeeTransactionColumnsArgs): ColumnDef<FeeTransaction>[] {
  const actions: RowAction<FeeTransaction>[] = [
    { label: "View Receipt", icon: EyeIcon, onSelect: onView },
    { label: "Print", icon: PrinterIcon, onSelect: onPrint },
    {
      label: "Void",
      icon: XCircleIcon,
      variant: "destructive",
      onSelect: onVoid,
      hidden: (tx) => tx.status === "pending",
      separatorBefore: true,
    },
  ]

  return [
    {
      accessorKey: "receiptNo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Receipt No." />,
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      id: "studentName",
      accessorFn: (tx) => {
        const s = studentsById.get(tx.studentId)
        return s ? `${s.firstName} ${s.lastName}` : "Unknown Student"
      },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      cell: ({ row }) => {
        const s = studentsById.get(row.original.studentId)
        const name = s ? `${s.firstName} ${s.lastName}` : "Unknown Student"
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              {s ? <span className="text-xs text-muted-foreground">{s.admissionNo}</span> : null}
            </div>
          </div>
        )
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => row.original.items.map((i) => i.label).join(", ") || "—",
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
    },
    {
      accessorKey: "mode",
      header: "Mode",
      cell: ({ getValue }) => {
        const mode = getValue<string>()
        return <span className="capitalize">{mode ? mode.replace("_", " ") : "—"}</span>
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "date",
      accessorFn: (tx) => tx.transactionDate ?? tx.dueDate,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    createActionsColumn<FeeTransaction>(actions),
  ]
}
