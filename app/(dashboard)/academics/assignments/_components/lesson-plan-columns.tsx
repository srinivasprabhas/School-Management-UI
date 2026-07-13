"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge"
import type { ClassSection, LessonPlan, Subject, Teacher } from "@/lib/data/types"

const STATUS_TONE: Record<LessonPlan["status"], StatusTone> = {
  planned: "info",
  in_progress: "warning",
  completed: "success",
}

const STATUS_LABEL: Record<LessonPlan["status"], string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
}

interface BuildColumnsArgs {
  subjectsById: Map<string, Subject>
  classSectionsById: Map<string, ClassSection>
  teachersById: Map<string, Teacher>
}

export function buildLessonPlanColumns({
  subjectsById,
  classSectionsById,
  teachersById,
}: BuildColumnsArgs): ColumnDef<LessonPlan>[] {
  return [
    {
      id: "subject",
      accessorFn: (lp) => subjectsById.get(lp.subjectId)?.name ?? "—",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
    },
    {
      id: "class",
      header: "Class",
      cell: ({ row }) => {
        const cs = classSectionsById.get(row.original.classSectionId)
        return <span>{cs ? `${cs.className} ${cs.section}` : "—"}</span>
      },
    },
    {
      id: "teacher",
      header: "Teacher",
      cell: ({ row }) => {
        const t = teachersById.get(row.original.teacherId)
        return <span>{t ? `${t.firstName} ${t.lastName}` : "—"}</span>
      },
    },
    {
      accessorKey: "topic",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Topic" />,
    },
    {
      accessorKey: "weekRange",
      header: "Week Range",
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue<LessonPlan["status"]>()
        return <StatusBadge label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
  ]
}
