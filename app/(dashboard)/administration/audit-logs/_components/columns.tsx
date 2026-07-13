"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { EyeIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge"
import { initials } from "@/lib/format"
import type { AuditLogEntry } from "@/lib/data/types"

const ACTION_TONE: Record<AuditLogEntry["action"], StatusTone> = {
  create: "success",
  update: "warning",
  delete: "destructive",
  login: "neutral",
  export: "info",
  permission_change: "warning",
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface BuildColumnsArgs {
  onViewDetails: (entry: AuditLogEntry) => void
}

export function buildAuditColumns({ onViewDetails }: BuildColumnsArgs): ColumnDef<AuditLogEntry>[] {
  const actions: RowAction<AuditLogEntry>[] = [{ label: "View Details", icon: EyeIcon, onSelect: onViewDetails }]

  return [
    createSelectColumn<AuditLogEntry>(),
    {
      accessorKey: "timestamp",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
      cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{formatDateTime(getValue<string>())}</span>,
    },
    {
      id: "user",
      accessorFn: (e) => e.actorName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(e.actorName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{e.actorName}</span>
              <Badge variant="outline" className="w-fit capitalize">
                {e.actorRole.replace("_", " ")}
              </Badge>
            </div>
          </div>
        )
      },
      filterFn: (row, id, value: string) => row.getValue<string>(id) === value,
    },
    {
      accessorKey: "action",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
      cell: ({ getValue }) => {
        const action = getValue<AuditLogEntry["action"]>()
        return <StatusBadge label={action.replace("_", " ")} tone={ACTION_TONE[action]} className="capitalize" />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "moduleEntity",
      accessorFn: (e) => e.module,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Module / Entity" />,
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium">{e.module}</span>
            <span className="text-xs text-muted-foreground">{e.entityType}</span>
          </div>
        )
      },
      filterFn: (row, id, value: string) => row.getValue<string>(id) === value,
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
    },
    {
      accessorKey: "ipAddress",
      header: ({ column }) => <DataTableColumnHeader column={column} title="IP Address" />,
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
    },
    createActionsColumn<AuditLogEntry>(actions),
  ]
}
