"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { createActionsColumn, type RowAction } from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus, type StatusTone } from "@/components/shared/status-badge"
import { initials } from "@/lib/format"
import type { SchoolClass, Subject, Teacher } from "@/lib/data/types"

const TYPE_TONE: Record<Subject["type"], StatusTone> = {
  core: "info",
  elective: "success",
  extra_curricular: "neutral",
}

const TYPE_LABEL: Record<Subject["type"], string> = {
  core: "Core",
  elective: "Elective",
  extra_curricular: "Extra Curricular",
}

interface BuildColumnsArgs {
  classesById: Map<string, SchoolClass>
  teachersById: Map<string, Teacher>
  onEdit: (subject: Subject) => void
  onDelete: (subject: Subject) => void
}

export function buildSubjectColumns({
  classesById,
  teachersById,
  onEdit,
  onDelete,
}: BuildColumnsArgs): ColumnDef<Subject>[] {
  const actions: RowAction<Subject>[] = [
    { label: "Edit", icon: PencilIcon, onSelect: onEdit },
    { label: "Delete", icon: Trash2Icon, variant: "destructive", onSelect: onDelete, separatorBefore: true },
  ]

  return [
    {
      id: "name",
      accessorFn: (s) => s.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.code}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ getValue }) => {
        const type = getValue<Subject["type"]>()
        return <StatusBadge label={TYPE_LABEL[type]} tone={TYPE_TONE[type]} />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "classes",
      header: "Classes Applicable",
      cell: ({ row }) => {
        const classNames = row.original.applicableClassIds
          .map((id) => classesById.get(id)?.name)
          .filter((n): n is string => !!n)
        const shown = classNames.slice(0, 2)
        const extra = classNames.length - shown.length
        return (
          <div className="flex flex-wrap items-center gap-1">
            {shown.map((name) => (
              <Badge key={name} variant="outline">
                {name}
              </Badge>
            ))}
            {extra > 0 ? <Badge variant="secondary">+{extra} more</Badge> : null}
          </div>
        )
      },
    },
    {
      id: "teachers",
      header: "Teachers",
      cell: ({ row }) => {
        const subjectTeachers = row.original.teacherIds
          .map((id) => teachersById.get(id))
          .filter((t): t is Teacher => !!t)
        if (subjectTeachers.length === 0) {
          return <span className="text-sm text-muted-foreground">Unassigned</span>
        }
        return (
          <AvatarGroup>
            {subjectTeachers.slice(0, 3).map((t) => (
              <Avatar key={t.id} size="sm">
                <AvatarFallback>{initials(`${t.firstName} ${t.lastName}`)}</AvatarFallback>
              </Avatar>
            ))}
            {subjectTeachers.length > 3 ? <AvatarGroupCount>+{subjectTeachers.length - 3}</AvatarGroupCount> : null}
          </AvatarGroup>
        )
      },
    },
    {
      accessorKey: "periodsPerWeek",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Periods/Week" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
    },
    createActionsColumn<Subject>(actions),
  ]
}
