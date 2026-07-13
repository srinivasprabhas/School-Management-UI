"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { EyeIcon, MailIcon, PencilIcon, PhoneIcon, PowerIcon, Trash2Icon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { initials } from "@/lib/format"
import type { StaffMember } from "@/lib/data/types"

interface BuildColumnsArgs {
  onView: (staff: StaffMember) => void
  onEdit: (staff: StaffMember) => void
  onDeactivate: (staff: StaffMember) => void
  onDelete: (staff: StaffMember) => void
}

export function buildStaffColumns({
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}: BuildColumnsArgs): ColumnDef<StaffMember>[] {
  const actions: RowAction<StaffMember>[] = [
    { label: "View Profile", icon: EyeIcon, onSelect: onView },
    { label: "Edit", icon: PencilIcon, onSelect: onEdit },
    {
      label: "Deactivate",
      icon: PowerIcon,
      onSelect: onDeactivate,
      hidden: (s) => s.status !== "active",
      separatorBefore: true,
    },
    {
      label: "Delete",
      icon: Trash2Icon,
      variant: "destructive",
      onSelect: onDelete,
    },
  ]

  return [
    createSelectColumn<StaffMember>(),
    {
      id: "name",
      accessorFn: (s) => s.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {s.photoUrl ? <AvatarImage src={s.photoUrl} alt={s.name} /> : null}
              <AvatarFallback>{initials(s.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.employeeId}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "designation",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Designation" />,
      cell: ({ getValue }) => <Badge variant="outline">{getValue<string>()}</Badge>,
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "contact",
      accessorFn: (s) => `${s.phone} ${s.email}`,
      header: "Contact",
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="flex items-center gap-1.5">
              <PhoneIcon className="size-3 text-muted-foreground" />
              {s.phone}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MailIcon className="size-3" />
              {s.email}
            </span>
          </div>
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
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    createActionsColumn<StaffMember>(actions),
  ]
}
