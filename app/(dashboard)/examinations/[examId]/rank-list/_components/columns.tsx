"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { initials } from "@/lib/format"
import type { ExamSubjectColumn, StudentExamResult } from "../../_components/exam-results"

export function buildRankListColumns(subjectColumns: ExamSubjectColumn[]): ColumnDef<StudentExamResult>[] {
  const subjectCols: ColumnDef<StudentExamResult>[] = subjectColumns.map((col) => ({
    id: `subject_${col.subjectId}`,
    header: col.name,
    accessorFn: (r) => r.subjectResults.find((sr) => sr.subjectId === col.subjectId)?.marksObtained ?? -1,
    cell: ({ row }) => {
      const sr = row.original.subjectResults.find((x) => x.subjectId === col.subjectId)
      if (!sr) return <span className="text-muted-foreground">-</span>
      return sr.isAbsent ? (
        <span className="text-destructive">AB</span>
      ) : (
        <span>
          {sr.marksObtained}/{sr.maxMarks}
        </span>
      )
    },
    enableHiding: true,
    enableSorting: false,
  }))

  return [
    {
      id: "rank",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rank" />,
      accessorFn: (r) => r.rank,
      cell: ({ getValue }) => <span className="font-medium">#{getValue<number>()}</span>,
    },
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
      id: "rollNo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Roll No." />,
      accessorFn: (r) => r.student.rollNo,
    },
    {
      id: "class",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
      accessorFn: (r) => `${r.classSection.className} ${r.classSection.section}`,
      filterFn: (row, id, value: string) => row.getValue<string>(id).startsWith(value),
    },
    ...subjectCols,
    {
      id: "total",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      accessorFn: (r) => r.total,
      cell: ({ row }) => (
        <span>
          {row.original.total}/{row.original.totalMax}
        </span>
      ),
    },
    {
      id: "percentage",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Percentage" />,
      accessorFn: (r) => r.percentage,
      cell: ({ getValue }) => <span>{getValue<number>().toFixed(1)}%</span>,
    },
    {
      id: "grade",
      header: "Grade",
      cell: ({ row }) => <Badge variant="outline">{row.original.grade}</Badge>,
    },
    {
      id: "result",
      header: "Result",
      cell: ({ row }) =>
        row.original.passed ? (
          <StatusBadge label="Pass" tone="success" />
        ) : (
          <StatusBadge label="Fail" tone="destructive" />
        ),
    },
  ]
}
