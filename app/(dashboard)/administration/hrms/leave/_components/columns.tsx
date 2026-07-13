"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { CheckIcon, EyeIcon, XIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate, initials } from "@/lib/format"
import type { UnifiedLeaveRow } from "./types"

interface BuildColumnsArgs {
  onApprove: (row: UnifiedLeaveRow) => void
  onReject: (row: UnifiedLeaveRow) => void
  onView: (row: UnifiedLeaveRow) => void
}

export function buildLeaveColumns({ onApprove, onReject, onView }: BuildColumnsArgs): ColumnDef<UnifiedLeaveRow>[] {
  const actions: RowAction<UnifiedLeaveRow>[] = [
    { label: "Approve", icon: CheckIcon, onSelect: onApprove, hidden: (r) => r.status !== "pending" },
    {
      label: "Reject",
      icon: XIcon,
      variant: "destructive",
      onSelect: onReject,
      hidden: (r) => r.status !== "pending",
    },
    { label: "View", icon: EyeIcon, onSelect: onView, separatorBefore: true },
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
            <div className="flex flex-col">
              <span className="font-medium">{r.staffName}</span>
              <Badge variant="outline" className="w-fit">
                {r.role}
              </Badge>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "leaveType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leave Type" />,
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="capitalize">
          {getValue<string>()}
        </Badge>
      ),
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "dateRange",
      accessorFn: (r) => r.fromDate,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date Range" />,
      cell: ({ row }) => {
        const r = row.original
        return (
          <span className="text-sm">
            {formatDate(r.fromDate)} – {formatDate(r.toDate)}
          </span>
        )
      },
    },
    {
      accessorKey: "daysCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Days" />,
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
    createActionsColumn<UnifiedLeaveRow>(actions),
  ]
}
