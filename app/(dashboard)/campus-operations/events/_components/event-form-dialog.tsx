"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useLogActivity } from "@/lib/data/audit"
import { useCalendarEvents, useTeachers } from "@/lib/data/store/entities"
import { toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { SchoolEvent } from "@/lib/data/types"

const EVENT_TYPE_LABEL: Record<SchoolEvent["type"], string> = {
  cultural: "Cultural",
  sports: "Sports",
  academic: "Academic",
  meeting: "Meeting",
  holiday_celebration: "Holiday Celebration",
}

const AUDIENCE_OPTIONS = ["All", "Students", "Parents", "Staff"]

interface EventFormValues {
  title: string
  type: SchoolEvent["type"]
  date: string
  startTime: string
  endTime: string
  venue: string
  audience: string
  organizerId: string
  description: string
}

function emptyForm(): EventFormValues {
  return {
    title: "",
    type: "cultural",
    date: toISODate(SEED_TODAY),
    startTime: "10:00",
    endTime: "12:00",
    venue: "",
    audience: "All",
    organizerId: "",
    description: "",
  }
}

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: SchoolEvent
  onSubmit: (event: SchoolEvent) => void
}

export function EventFormDialog({ open, onOpenChange, event, onSubmit }: EventFormDialogProps) {
  const { items: teachers } = useTeachers()
  const { add: addCalendarEvent } = useCalendarEvents()
  const logActivity = useLogActivity()

  const [values, setValues] = useState<EventFormValues>(emptyForm())
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(
        event
          ? {
              title: event.title,
              type: event.type,
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
              venue: event.venue,
              audience: event.audience,
              organizerId: event.organizerId ?? "",
              description: event.description ?? "",
            }
          : emptyForm()
      )
    }
  }, [open, event])

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim() || !values.venue.trim()) {
      toast.error("Please fill in the title and venue.")
      return
    }
    setPending(true)

    const base = event
    const result: SchoolEvent = {
      id: base?.id ?? `evt_new_${Date.now()}`,
      title: values.title,
      type: values.type,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      venue: values.venue,
      audience: values.audience,
      organizerId: values.organizerId || undefined,
      description: values.description || undefined,
      status: base?.status ?? "scheduled",
    }

    setTimeout(() => {
      onSubmit(result)
      if (!base) {
        addCalendarEvent({
          id: `cal_evt_${result.id}`,
          title: result.title,
          type: "event",
          date: result.date,
          allDay: false,
          description: `${result.venue} · ${result.startTime}-${result.endTime}`,
          audience: result.audience,
        })
      }
      logActivity({
        action: base ? "update" : "create",
        module: "Events",
        entityType: "SchoolEvent",
        entityId: result.id,
        description: `${base ? "Updated" : "Added"} event ${result.title}`,
      })
      toast.success(base ? "Event updated" : "Event added", { description: result.title })
      setPending(false)
      onOpenChange(false)
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] scrollbar-thin overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {event ? "Update this event's details." : "Schedule a new school event."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input id="title" required value={values.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select value={values.type} onValueChange={(v) => set("type", (v ?? "cultural") as SchoolEvent["type"])}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Input id="date" type="date" required value={values.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="startTime">Start time</FieldLabel>
                <Input id="startTime" type="time" value={values.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="endTime">End time</FieldLabel>
                <Input id="endTime" type="time" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="venue">Venue</FieldLabel>
                <Input id="venue" required value={values.venue} onChange={(e) => set("venue", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="audience">Audience</FieldLabel>
                <Select value={values.audience} onValueChange={(v) => set("audience", v ?? "All")}>
                  <SelectTrigger id="audience" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="organizer">Organizer</FieldLabel>
              <Select value={values.organizerId} onValueChange={(v) => set("organizerId", v ?? "")}>
                <SelectTrigger id="organizer" className="w-full">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Optional details about the event…"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {event ? "Save Changes" : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
