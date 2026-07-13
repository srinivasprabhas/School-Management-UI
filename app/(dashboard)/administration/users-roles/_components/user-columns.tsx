"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { KeyRoundIcon, PencilIcon, PowerIcon, ShieldIcon, Trash2Icon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate, initials } from "@/lib/format"
import { ROLE_LABELS } from "@/lib/rbac/types"
import type { Role } from "@/lib/rbac/types"
import type { AppUser } from "@/lib/data/types"
import { toneForRole } from "./role-tone"

interface BuildColumnsArgs {
  canDelete: boolean
  onEdit: (user: AppUser) => void
  onChangeRole: (user: AppUser) => void
  onResetPassword: (user: AppUser) => void
  onToggleStatus: (user: AppUser) => void
  onDelete: (user: AppUser) => void
}

export function buildUserColumns({
  canDelete,
  onEdit,
  onChangeRole,
  onResetPassword,
  onToggleStatus,
  onDelete,
}: BuildColumnsArgs): ColumnDef<AppUser>[] {
  const actions: RowAction<AppUser>[] = [
    { label: "Edit", icon: PencilIcon, onSelect: onEdit },
    { label: "Change Role", icon: ShieldIcon, onSelect: onChangeRole },
    { label: "Reset Password", icon: KeyRoundIcon, onSelect: onResetPassword },
    {
      label: "Suspend",
      icon: PowerIcon,
      onSelect: onToggleStatus,
      hidden: (u) => u.status === "suspended",
      separatorBefore: true,
    },
    {
      label: "Activate",
      icon: PowerIcon,
      onSelect: onToggleStatus,
      hidden: (u) => u.status !== "suspended",
    },
    {
      label: "Delete",
      icon: Trash2Icon,
      variant: "destructive",
      onSelect: onDelete,
      hidden: () => !canDelete,
      separatorBefore: true,
    },
  ]

  return [
    createSelectColumn<AppUser>(),
    {
      id: "name",
      accessorFn: (u) => u.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.name} /> : null}
              <AvatarFallback>{initials(u.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{u.name}</span>
              <span className="text-xs text-muted-foreground">{u.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ getValue }) => {
        const role = getValue<string>()
        return <StatusBadge label={ROLE_LABELS[role as Role] ?? role} tone={toneForRole(role)} />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
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
      accessorKey: "lastLogin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
      cell: ({ getValue }) => formatDate(getValue<string | undefined>()),
    },
    createActionsColumn<AppUser>(actions),
  ]
}
