"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  CalendarPlusIcon,
  EyeIcon,
  PencilIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { initials } from "@/lib/format"
import type { ClassSection, Subject, Teacher } from "@/lib/data/types"

interface BuildColumnsArgs {
  classSectionsById: Map<string, ClassSection>
  subjectsById: Map<string, Subject>
  onView: (teacher: Teacher) => void
  onEdit: (teacher: Teacher) => void
  onAssignClass: (teacher: Teacher) => void
  onDeactivate: (teacher: Teacher) => void
  onDelete: (teacher: Teacher) => void
}

export function buildTeacherColumns({
  classSectionsById,
  subjectsById,
  onView,
  onEdit,
  onAssignClass,
  onDeactivate,
  onDelete,
}: BuildColumnsArgs): ColumnDef<Teacher>[] {
  const actions: RowAction<Teacher>[] = [
    { label: "View Profile", icon: EyeIcon, onSelect: onView },
    { label: "Edit", icon: PencilIcon, onSelect: onEdit },
    { label: "Assign Class", icon: CalendarPlusIcon, onSelect: onAssignClass },
    {
      label: "Deactivate",
      icon: PowerIcon,
      onSelect: onDeactivate,
      hidden: (t) => t.status !== "active",
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
    createSelectColumn<Teacher>(),
    {
      id: "name",
      accessorFn: (t) => `${t.firstName} ${t.lastName}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const t = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(`${t.firstName} ${t.lastName}`)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {t.firstName} {t.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{t.designation}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "employeeId",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employee ID" />,
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "subjects",
      accessorFn: (t) =>
        t.subjectIds
          .map((id) => subjectsById.get(id)?.name)
          .filter(Boolean)
          .join(" "),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subjects" />,
      cell: ({ row }) => {
        const names = row.original.subjectIds
          .map((id) => subjectsById.get(id)?.name)
          .filter((n): n is string => !!n)
        const shown = names.slice(0, 2)
        const extra = names.length - shown.length
        if (names.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {shown.map((n) => (
              <Badge key={n} variant="outline">
                {n}
              </Badge>
            ))}
            {extra > 0 ? <Badge variant="secondary">+{extra} more</Badge> : null}
          </div>
        )
      },
    },
    {
      id: "assignedClasses",
      accessorFn: (t) =>
        t.assignedClasses
          .map((ac) => {
            const section = classSectionsById.get(ac.classSectionId)
            return section ? `${section.className} ${section.section}` : null
          })
          .filter(Boolean)
          .join(" "),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned Classes" />,
      cell: ({ row }) => {
        const labels = row.original.assignedClasses
          .map((ac) => {
            const section = classSectionsById.get(ac.classSectionId)
            return section ? `${section.className} ${section.section}` : null
          })
          .filter((n): n is string => !!n)
        const shown = labels.slice(0, 2)
        const extra = labels.length - shown.length
        if (labels.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {shown.map((n, i) => (
              <Badge key={`${n}-${i}`} variant="outline">
                {n}
              </Badge>
            ))}
            {extra > 0 ? <Badge variant="secondary">+{extra} more</Badge> : null}
          </div>
        )
      },
    },
    {
      id: "contact",
      accessorFn: (t) => `${t.phone} ${t.email}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone / Email" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.phone}</span>
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
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
    createActionsColumn<Teacher>(actions),
  ]
}
