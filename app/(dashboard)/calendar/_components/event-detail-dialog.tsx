"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useCalendarEvents } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { formatDate } from "@/lib/format"
import { CALENDAR_EVENT_META, type DisplayEvent } from "./calendar-utils"

interface EventDetailDialogProps {
  event: DisplayEvent | null
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}

export function EventDetailDialog({ event, onOpenChange, onEdit }: EventDetailDialogProps) {
  const { remove } = useCalendarEvents()
  const logActivity = useLogActivity()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  if (!event) return null
  const meta = CALENDAR_EVENT_META[event.type]

  return (
    <>
      <Dialog open={!!event} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {event.title}
              <StatusBadge label={meta.label} tone={meta.tone} />
            </DialogTitle>
            <DialogDescription>
              {event.isPseudo ? "Automatically generated from records — read-only." : "Calendar event"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>
                {formatDate(event.date)}
                {event.endDate && event.endDate !== event.date ? ` – ${formatDate(event.endDate)}` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">All day</span>
              <span>{event.allDay ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audience</span>
              <span>{event.audience}</span>
            </div>
            {event.description ? (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Description</span>
                <p>{event.description}</p>
              </div>
            ) : null}
          </div>
          {!event.isPseudo ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2Icon data-icon="inline-start" />
                Delete
              </Button>
              <Button onClick={onEdit}>
                <PencilIcon data-icon="inline-start" />
                Edit
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete event?"
        description={`This will permanently remove "${event.title}" from the calendar.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          remove(event.id)
          logActivity({
            action: "delete",
            module: "Calendar",
            entityType: "CalendarEvent",
            entityId: event.id,
            description: `Deleted calendar event ${event.title}`,
          })
          toast.success("Event deleted")
          setConfirmDeleteOpen(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}
