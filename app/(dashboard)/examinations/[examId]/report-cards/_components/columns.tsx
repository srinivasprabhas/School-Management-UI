"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { EyeIcon, SendIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge } from "@/components/shared/status-badge"
import { initials } from "@/lib/format"
import type { StudentExamResult } from "../../_components/exam-results"

interface BuildColumnsArgs {
  isPublished: boolean
  onPreview: (result: StudentExamResult) => void
  onPublish: (result: StudentExamResult) => void
}

export function buildReportCardColumns({
  isPublished,
  onPreview,
  onPublish,
}: BuildColumnsArgs): ColumnDef<StudentExamResult>[] {
  const actions: RowAction<StudentExamResult>[] = [
    { label: "Preview", icon: EyeIcon, onSelect: onPreview },
    {
      label: "Publish",
      icon: SendIcon,
      onSelect: onPublish,
      hidden: () => isPublished,
      separatorBefore: true,
    },
  ]

  return [
    createSelectColumn<StudentExamResult>(),
    {
      id: "student",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      accessorFn: (r) => `${r.student.firstName} ${r.student.lastName}`,
      cell: ({ row }) => {
        const s = row.original.student
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(`${s.firstName} ${s.lastName}`)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {s.firstName} {s.lastName}
            </span>
          </div>
        )
      },
    },
    {
      id: "class",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
      accessorFn: (r) => `${r.classSection.className} ${r.classSection.section}`,
    },
    {
      id: "percentage",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Overall %" />,
      accessorFn: (r) => r.percentage,
      cell: ({ getValue }) => <span>{getValue<number>().toFixed(1)}%</span>,
    },
    {
      id: "grade",
      header: "Grade",
      cell: ({ row }) => <Badge variant="outline">{row.original.grade}</Badge>,
    },
    {
      id: "rank",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rank" />,
      accessorFn: (r) => r.rank,
      cell: ({ getValue }) => <span>#{getValue<number>()}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: () =>
        isPublished ? (
          <StatusBadge label="Published" tone="success" />
        ) : (
          <StatusBadge label="Draft" tone="warning" />
        ),
    },
    createActionsColumn<StudentExamResult>(actions),
  ]
}
