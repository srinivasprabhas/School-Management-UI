"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  CheckCircle2Icon,
  FileTextIcon,
  ListOrderedIcon,
  PencilIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { createActionsColumn, type RowAction } from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/format"
import type { ClassSection, Exam } from "@/lib/data/types"

interface BuildColumnsArgs {
  classSectionsById: Map<string, ClassSection>
  onManageSubjects: (exam: Exam) => void
  onEnterMarks: (exam: Exam) => void
  onRankList: (exam: Exam) => void
  onReportCards: (exam: Exam) => void
  onPublish: (exam: Exam) => void
  onDelete: (exam: Exam) => void
}

export function buildExamColumns({
  classSectionsById,
  onManageSubjects,
  onEnterMarks,
  onRankList,
  onReportCards,
  onPublish,
  onDelete,
}: BuildColumnsArgs): ColumnDef<Exam>[] {
  const actions: RowAction<Exam>[] = [
    { label: "Manage Subjects", icon: SlidersHorizontalIcon, onSelect: onManageSubjects },
    { label: "Enter Marks", icon: PencilIcon, onSelect: onEnterMarks },
    { label: "Rank List", icon: ListOrderedIcon, onSelect: onRankList },
    { label: "Report Cards", icon: FileTextIcon, onSelect: onReportCards },
    {
      label: "Publish",
      icon: CheckCircle2Icon,
      onSelect: onPublish,
      hidden: (e) => e.status === "published",
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
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: "term",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Term" />,
    },
    {
      accessorKey: "academicYear",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Academic Year" />,
    },
    {
      id: "classes",
      header: "Classes",
      cell: ({ row }) => {
        const sections = row.original.classSectionIds
          .map((id) => classSectionsById.get(id))
          .filter((cs): cs is ClassSection => !!cs)
        return (
          <div className="flex flex-wrap gap-1">
            {sections.slice(0, 3).map((cs) => (
              <Badge key={cs.id} variant="outline">
                {cs.className}-{cs.section}
              </Badge>
            ))}
            {sections.length > 3 ? <Badge variant="outline">+{sections.length - 3}</Badge> : null}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: "dateRange",
      header: "Date Range",
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}
        </span>
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
    createActionsColumn<Exam>(actions),
  ]
}
