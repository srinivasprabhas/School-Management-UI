"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCalendarEvents } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { CalendarEvent, CalendarEventType } from "@/lib/data/types"

const EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
  { value: "holiday", label: "Holiday" },
  { value: "exam", label: "Exam" },
  { value: "event", label: "Event" },
  { value: "meeting", label: "Meeting" },
  { value: "fee_due", label: "Fee Due" },
  { value: "birthday", label: "Birthday" },
  { value: "academic", label: "Academic" },
]

const AUDIENCES = ["All", "Students", "Parents", "Staff", "Teachers"]

interface FormValues {
  title: string
  type: CalendarEventType
  date: string
  endDate: string
  allDay: boolean
  description: string
  audience: string
}

function emptyForm(prefillDate?: string): FormValues {
  return {
    title: "",
    type: "event",
    date: prefillDate ?? new Date().toISOString().slice(0, 10),
    endDate: "",
    allDay: true,
    description: "",
    audience: "All",
  }
}

function eventToForm(event: CalendarEvent): FormValues {
  return {
    title: event.title,
    type: event.type,
    date: event.date,
    endDate: event.endDate ?? "",
    allDay: event.allDay,
    description: event.description ?? "",
    audience: event.audience,
  }
}

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingEvent?: CalendarEvent
  prefillDate?: string
}

export function EventFormDialog({ open, onOpenChange, editingEvent, prefillDate }: EventFormDialogProps) {
  const { add, update } = useCalendarEvents()
  const logActivity = useLogActivity()
  const [values, setValues] = useState<FormValues>(emptyForm(prefillDate))

  useEffect(() => {
    if (open) {
      setValues(editingEvent ? eventToForm(editingEvent) : emptyForm(prefillDate))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingEvent, prefillDate])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result: CalendarEvent = {
      id: editingEvent?.id ?? `cal_new_${Date.now()}`,
      title: values.title,
      type: values.type,
      date: values.date,
      endDate: values.endDate || undefined,
      allDay: values.allDay,
      description: values.description || undefined,
      audience: values.audience,
      createdBy: editingEvent?.createdBy,
    }

    if (editingEvent) {
      update(result.id, result)
    } else {
      add(result)
    }
    logActivity({
      action: editingEvent ? "update" : "create",
      module: "Calendar",
      entityType: "CalendarEvent",
      entityId: result.id,
      description: `${editingEvent ? "Updated" : "Added"} calendar event ${result.title}`,
    })
    toast.success(editingEvent ? "Event updated" : "Event added", { description: result.title })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>
            {editingEvent ? "Update this calendar event." : "Add a new event to the school calendar."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="evtTitle">Title</FieldLabel>
              <Input id="evtTitle" required value={values.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="evtType">Type</FieldLabel>
                <Select value={values.type} onValueChange={(v) => set("type", (v ?? "event") as CalendarEventType)}>
                  <SelectTrigger id="evtType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="evtAudience">Audience</FieldLabel>
                <Select value={values.audience} onValueChange={(v) => set("audience", v ?? "All")}>
                  <SelectTrigger id="evtAudience" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="evtStart">Start date</FieldLabel>
                <Input id="evtStart" type="date" required value={values.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="evtEnd">End date (optional)</FieldLabel>
                <Input id="evtEnd" type="date" value={values.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Checkbox
                id="evtAllDay"
                checked={values.allDay}
                onCheckedChange={(checked) => set("allDay", checked)}
              />
              <FieldLabel htmlFor="evtAllDay" className="font-normal">
                All-day event
              </FieldLabel>
            </Field>
            <Field>
              <FieldLabel htmlFor="evtDescription">Description</FieldLabel>
              <Textarea
                id="evtDescription"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingEvent ? "Save Changes" : "Add Event"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
