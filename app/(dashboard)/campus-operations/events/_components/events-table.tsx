"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { BanIcon, PartyPopperIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { useSchoolEvents, useTeachers } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { formatDate, initials } from "@/lib/format"
import type { SchoolEvent, Teacher } from "@/lib/data/types"
import { EventFormDialog } from "./event-form-dialog"

const EVENT_TYPE_LABEL: Record<SchoolEvent["type"], string> = {
  cultural: "Cultural",
  sports: "Sports",
  academic: "Academic",
  meeting: "Meeting",
  holiday_celebration: "Holiday Celebration",
}

function buildEventColumns(args: {
  teachersById: Map<string, Teacher>
  onEdit: (e: SchoolEvent) => void
  onCancel: (e: SchoolEvent) => void
  onDelete: (e: SchoolEvent) => void
}): ColumnDef<SchoolEvent>[] {
  const actions: RowAction<SchoolEvent>[] = [
    { label: "Edit", icon: PencilIcon, onSelect: args.onEdit },
    {
      label: "Cancel Event",
      icon: BanIcon,
      onSelect: args.onCancel,
      hidden: (e) => e.status !== "scheduled",
      separatorBefore: true,
    },
    { label: "Delete", icon: Trash2Icon, variant: "destructive", onSelect: args.onDelete },
  ]

  return [
    createSelectColumn<SchoolEvent>(),
    {
      id: "event",
      accessorFn: (e) => e.title,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Event" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <PartyPopperIcon className="size-4" />
          </div>
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ getValue }) => <Badge variant="secondary">{EVENT_TYPE_LABEL[getValue<SchoolEvent["type"]>()]}</Badge>,
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "datetime",
      accessorFn: (e) => e.date,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date / Time" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatDate(row.original.date)}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.startTime} – {row.original.endTime}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "venue",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Venue" />,
    },
    {
      accessorKey: "audience",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Audience" />,
      cell: ({ getValue }) => <Badge variant="outline">{getValue<string>()}</Badge>,
    },
    {
      id: "organizer",
      accessorFn: (e) => {
        const t = e.organizerId ? args.teachersById.get(e.organizerId) : undefined
        return t ? `${t.firstName} ${t.lastName}` : ""
      },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Organizer" />,
      cell: ({ getValue }) => {
        const name = getValue<string>()
        if (!name) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <span>{name}</span>
          </div>
        )
      },
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
    createActionsColumn<SchoolEvent>(actions),
  ]
}

export function EventsTable() {
  const { items: events, add, update, remove } = useSchoolEvents()
  const { items: teachers } = useTeachers()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | undefined>(undefined)
  const [deletingEvent, setDeletingEvent] = useState<SchoolEvent | null>(null)

  const teachersById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])

  const columns = useMemo(
    () =>
      buildEventColumns({
        teachersById,
        onEdit: (e) => {
          setEditingEvent(e)
          setFormOpen(true)
        },
        onCancel: (e) => {
          update(e.id, { status: "cancelled" })
          toast.success("Event cancelled")
        },
        onDelete: (e) => setDeletingEvent(e),
      }),
    [teachersById, update]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Events"
        description="Plan and track school events and celebrations."
        actions={
          <Button
            onClick={() => {
              setEditingEvent(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add Event
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={events}
        searchKey="event"
        searchPlaceholder="Search by event title…"
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Scheduled", value: "scheduled" },
              { label: "Cancelled", value: "cancelled" },
              { label: "Completed", value: "completed" },
            ],
          },
        ]}
        emptyTitle="No events found"
        emptyDescription="Add your first school event to get started."
      />

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        onSubmit={(event) => {
          if (editingEvent) update(event.id, event)
          else add(event)
        }}
      />

      <ConfirmDialog
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        title="Delete event?"
        description={`This will permanently remove "${deletingEvent?.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingEvent) return
          remove(deletingEvent.id)
          logActivity({
            action: "delete",
            module: "Events",
            entityType: "SchoolEvent",
            entityId: deletingEvent.id,
            description: `Deleted event ${deletingEvent.title}`,
          })
          toast.success("Event deleted")
          setDeletingEvent(null)
        }}
      />
    </div>
  )
}
