"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/format"
import type { JobOpening } from "@/lib/data/types"

export function buildOpeningColumns(): ColumnDef<JobOpening>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      accessorKey: "openings",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Openings" />,
    },
    {
      accessorKey: "postedDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Posted" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
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
  ]
}
