"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRightCircleIcon, CalendarPlusIcon, StarIcon, XCircleIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate, initials } from "@/lib/format"
import type { Candidate, JobOpening } from "@/lib/data/types"

interface BuildColumnsArgs {
  jobsById: Map<string, JobOpening>
  onMoveStage: (candidate: Candidate) => void
  onScheduleInterview: (candidate: Candidate) => void
  onReject: (candidate: Candidate) => void
}

const TERMINAL_STAGES: Candidate["stage"][] = ["hired", "rejected"]

export function buildCandidateColumns({
  jobsById,
  onMoveStage,
  onScheduleInterview,
  onReject,
}: BuildColumnsArgs): ColumnDef<Candidate>[] {
  const actions: RowAction<Candidate>[] = [
    {
      label: "Move Stage",
      icon: ArrowRightCircleIcon,
      onSelect: onMoveStage,
      hidden: (c) => TERMINAL_STAGES.includes(c.stage),
    },
    {
      label: "Schedule Interview",
      icon: CalendarPlusIcon,
      onSelect: onScheduleInterview,
      hidden: (c) => TERMINAL_STAGES.includes(c.stage),
    },
    {
      label: "Reject",
      icon: XCircleIcon,
      variant: "destructive",
      onSelect: onReject,
      hidden: (c) => TERMINAL_STAGES.includes(c.stage),
      separatorBefore: true,
    },
  ]

  return [
    {
      id: "name",
      accessorFn: (c) => c.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(c.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{c.name}</span>
          </div>
        )
      },
    },
    {
      id: "job",
      accessorFn: (c) => jobsById.get(c.jobId)?.title ?? "—",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applied For" />,
    },
    {
      accessorKey: "stage",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
      cell: ({ getValue }) => {
        const stage = getValue<string>()
        return <StatusBadge label={stage} tone={toneForStatus(stage)} className="capitalize" />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      accessorKey: "appliedDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applied Date" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      accessorKey: "rating",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
      cell: ({ getValue }) => {
        const rating = getValue<number | undefined>()
        if (!rating) return <span className="text-muted-foreground">—</span>
        return (
          <span className="flex items-center gap-1">
            <StarIcon className="size-3.5 fill-warning text-warning" />
            {rating}
          </span>
        )
      },
    },
    createActionsColumn<Candidate>(actions),
  ]
}
