"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { CheckCircleIcon, DownloadIcon, ReceiptIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatCurrency, initials } from "@/lib/format"
import type { PayrollRecord } from "@/lib/data/types"

interface BuildColumnsArgs {
  onViewPayslip: (record: PayrollRecord) => void
  onMarkPaid: (record: PayrollRecord) => void
  onDownload: (record: PayrollRecord) => void
}

export function buildPayrollColumns({
  onViewPayslip,
  onMarkPaid,
  onDownload,
}: BuildColumnsArgs): ColumnDef<PayrollRecord>[] {
  const actions: RowAction<PayrollRecord>[] = [
    { label: "View Payslip", icon: ReceiptIcon, onSelect: onViewPayslip },
    {
      label: "Mark as Paid",
      icon: CheckCircleIcon,
      onSelect: onMarkPaid,
      hidden: (r) => r.status === "paid",
    },
    { label: "Download", icon: DownloadIcon, onSelect: onDownload, separatorBefore: true },
  ]

  return [
    {
      id: "staff",
      accessorFn: (r) => r.staffName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Staff" />,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(r.staffName)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{r.staffName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "period",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "gross",
      accessorFn: (r) => r.basicSalary + r.allowances,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Gross" />,
      cell: ({ getValue }) => <span>{formatCurrency(getValue<number>())}</span>,
    },
    {
      accessorKey: "netPay",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Net" />,
      cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue<number>())}</span>,
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
    createActionsColumn<PayrollRecord>(actions),
  ]
}
