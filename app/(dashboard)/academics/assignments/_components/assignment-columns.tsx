"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { EyeIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { createActionsColumn, type RowAction } from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge"
import { formatDate, initials } from "@/lib/format"
import type { Assignment, ClassSection, Subject, Teacher } from "@/lib/data/types"

const TYPE_TONE: Record<Assignment["type"], StatusTone> = {
  homework: "info",
  assignment: "success",
  project: "neutral",
}

const TYPE_LABEL: Record<Assignment["type"], string> = {
  homework: "Homework",
  assignment: "Assignment",
  project: "Project",
}

const STATUS_TONE: Record<Assignment["status"], StatusTone> = { open: "success", closed: "neutral" }

interface BuildColumnsArgs {
  classSectionsById: Map<string, ClassSection>
  subjectsById: Map<string, Subject>
  teachersById: Map<string, Teacher>
  onViewSubmissions: (assignment: Assignment) => void
}

export function buildAssignmentColumns({
  classSectionsById,
  subjectsById,
  teachersById,
  onViewSubmissions,
}: BuildColumnsArgs): ColumnDef<Assignment>[] {
  const actions: RowAction<Assignment>[] = [{ label: "View Submissions", icon: EyeIcon, onSelect: onViewSubmissions }]

  return [
    {
      id: "title",
      accessorFn: (a) => a.title,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          <StatusBadge label={TYPE_LABEL[row.original.type]} tone={TYPE_TONE[row.original.type]} className="w-fit" />
        </div>
      ),
    },
    {
      id: "class",
      header: "Class/Section",
      cell: ({ row }) => {
        const cs = classSectionsById.get(row.original.classSectionId)
        return <span>{cs ? `${cs.className} ${cs.section}` : "—"}</span>
      },
    },
    {
      id: "subject",
      header: "Subject",
      cell: ({ row }) => <span>{subjectsById.get(row.original.subjectId)?.name ?? "—"}</span>,
    },
    {
      id: "teacher",
      header: "Teacher",
      cell: ({ row }) => {
        const teacher = teachersById.get(row.original.teacherId)
        if (!teacher) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(`${teacher.firstName} ${teacher.lastName}`)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {teacher.firstName} {teacher.lastName}
            </span>
          </div>
        )
      },
    },
    {
      id: "dueDate",
      accessorFn: (a) => a.dueDate,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      id: "progress",
      header: "Submissions",
      cell: ({ row }) => {
        const { submittedCount, totalStudents } = row.original
        const pct = totalStudents ? Math.round((submittedCount / totalStudents) * 100) : 0
        return (
          <div className="flex w-32 flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {submittedCount}/{totalStudents}
            </span>
            <Progress value={pct} />
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue<Assignment["status"]>()
        return <StatusBadge label={status} tone={STATUS_TONE[status]} className="capitalize" />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    createActionsColumn<Assignment>(actions),
  ]
}
