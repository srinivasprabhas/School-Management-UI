"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  CalendarCheckIcon,
  EyeIcon,
  PencilIcon,
  PowerIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { initials } from "@/lib/format"
import type { ClassSection, Student } from "@/lib/data/types"

interface BuildColumnsArgs {
  classSectionsById: Map<string, ClassSection>
  onView: (student: Student) => void
  onEdit: (student: Student) => void
  onTakeAttendance: (student: Student) => void
  onCollectFee: (student: Student) => void
  onDeactivate: (student: Student) => void
  onDelete: (student: Student) => void
}

export function buildStudentColumns({
  classSectionsById,
  onView,
  onEdit,
  onTakeAttendance,
  onCollectFee,
  onDeactivate,
  onDelete,
}: BuildColumnsArgs): ColumnDef<Student>[] {
  const actions: RowAction<Student>[] = [
    { label: "View Profile", icon: EyeIcon, onSelect: onView },
    { label: "Edit", icon: PencilIcon, onSelect: onEdit },
    { label: "Take Attendance", icon: CalendarCheckIcon, onSelect: onTakeAttendance },
    { label: "Collect Fee", icon: WalletIcon, onSelect: onCollectFee },
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
    createSelectColumn<Student>(),
    {
      accessorKey: "admissionNo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Admission No." />,
    },
    {
      id: "name",
      accessorFn: (s) => `${s.firstName} ${s.lastName}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(`${s.firstName} ${s.lastName}`)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {s.firstName} {s.lastName}
              </span>
              <span className="text-xs text-muted-foreground">Roll No. {s.rollNo}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "class",
      accessorFn: (s) => {
        const section = classSectionsById.get(s.classSectionId)
        return section ? `${section.className} ${section.section}` : ""
      },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
      cell: ({ getValue }) => <span>{getValue<string>()}</span>,
      filterFn: (row, id, value: string) => row.getValue<string>(id).startsWith(value),
    },
    {
      id: "parent",
      accessorFn: (s) => s.father.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Parent" />,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
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
    createActionsColumn<Student>(actions),
  ]
}
