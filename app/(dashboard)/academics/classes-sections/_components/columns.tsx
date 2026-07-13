"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { EyeIcon, PencilIcon, Trash2Icon, UserCogIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { createActionsColumn, type RowAction } from "@/components/shared/data-table/columns-helpers"
import { initials } from "@/lib/format"
import type { ClassSection, Teacher } from "@/lib/data/types"

interface BuildColumnsArgs {
  teachersById: Map<string, Teacher>
  studentCountBySection: Map<string, number>
  onViewStudents: (cs: ClassSection) => void
  onEdit: (cs: ClassSection) => void
  onAssignTeacher: (cs: ClassSection) => void
  onDelete: (cs: ClassSection) => void
}

export function buildClassSectionColumns({
  teachersById,
  studentCountBySection,
  onViewStudents,
  onEdit,
  onAssignTeacher,
  onDelete,
}: BuildColumnsArgs): ColumnDef<ClassSection>[] {
  const actions: RowAction<ClassSection>[] = [
    { label: "View Students", icon: EyeIcon, onSelect: onViewStudents },
    { label: "Edit", icon: PencilIcon, onSelect: onEdit },
    { label: "Assign Class Teacher", icon: UserCogIcon, onSelect: onAssignTeacher },
    { label: "Delete", icon: Trash2Icon, variant: "destructive", onSelect: onDelete, separatorBefore: true },
  ]

  return [
    {
      id: "className",
      accessorFn: (cs) => `${cs.className} ${cs.section}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class & Section" />,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.className} — {row.original.section}
        </span>
      ),
    },
    {
      id: "classTeacher",
      header: "Class Teacher",
      cell: ({ row }) => {
        const teacher = row.original.classTeacherId ? teachersById.get(row.original.classTeacherId) : undefined
        if (!teacher) return <span className="text-sm text-muted-foreground">Unassigned</span>
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
      accessorKey: "roomNo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Room No." />,
    },
    {
      id: "students",
      header: "Students",
      cell: ({ row }) => {
        const count = studentCountBySection.get(row.original.id) ?? 0
        const capacity = row.original.capacity
        return (
          <div className="flex w-32 flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {count}/{capacity}
            </span>
            <Progress value={capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0} />
          </div>
        )
      },
    },
    createActionsColumn<ClassSection>(actions),
  ]
}
