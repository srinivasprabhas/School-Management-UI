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
import { useLogActivity } from "@/lib/data/audit"
import { useSubjects, useTeachers, useTimetable } from "@/lib/data/store/entities"
import type { TimetableSlot } from "@/lib/data/types"
import { PERIOD_TIMES } from "./timetable-utils"

interface TimetableSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classSectionId: string
  sectionLabel: string
  day: TimetableSlot["day"]
  period: number
  existing: TimetableSlot | null
  defaultRoomNo: string
}

export function TimetableSlotDialog({
  open,
  onOpenChange,
  classSectionId,
  sectionLabel,
  day,
  period,
  existing,
  defaultRoomNo,
}: TimetableSlotDialogProps) {
  const { items: subjects } = useSubjects()
  const { items: teachers } = useTeachers()
  const { add, update, remove } = useTimetable()
  const logActivity = useLogActivity()

  const [subjectId, setSubjectId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [roomNo, setRoomNo] = useState("")

  useEffect(() => {
    if (open) {
      setSubjectId(existing?.subjectId ?? "")
      setTeacherId(existing?.teacherId ?? "")
      setRoomNo(existing?.roomNo ?? defaultRoomNo)
    }
  }, [open, existing, defaultRoomNo])

  const [startTime, endTime] = PERIOD_TIMES[period - 1] ?? ["", ""]

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId || !teacherId) {
      toast.error("Please select a subject and teacher.")
      return
    }
    if (existing) {
      update(existing.id, { subjectId, teacherId, roomNo })
      logActivity({
        action: "update",
        module: "Academics",
        entityType: "TimetableSlot",
        entityId: existing.id,
        description: `Updated timetable slot for ${sectionLabel} — ${day} period ${period}`,
      })
      toast.success("Timetable slot updated")
    } else {
      const id = `tt_${classSectionId}_${day}_${period}_${Date.now()}`
      add({ id, classSectionId, day, period, subjectId, teacherId, roomNo, startTime, endTime })
      logActivity({
        action: "create",
        module: "Academics",
        entityType: "TimetableSlot",
        entityId: id,
        description: `Assigned timetable slot for ${sectionLabel} — ${day} period ${period}`,
      })
      toast.success("Timetable slot assigned")
    }
    onOpenChange(false)
  }

  function handleClear() {
    if (!existing) return
    remove(existing.id)
    logActivity({
      action: "delete",
      module: "Academics",
      entityType: "TimetableSlot",
      entityId: existing.id,
      description: `Cleared timetable slot for ${sectionLabel} — ${day} period ${period}`,
    })
    toast.success("Slot cleared")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Slot" : "Assign Slot"}</DialogTitle>
          <DialogDescription>
            {sectionLabel} · {day}, Period {period} ({startTime}–{endTime})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="slot-subject">Subject</FieldLabel>
              <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
                <SelectTrigger id="slot-subject" className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="slot-teacher">Teacher</FieldLabel>
              <Select value={teacherId} onValueChange={(v) => setTeacherId(v ?? "")}>
                <SelectTrigger id="slot-teacher" className="w-full">
                  <SelectValue placeholder="Select teacher" />
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
              <FieldLabel htmlFor="slot-room">Room No.</FieldLabel>
              <Input id="slot-room" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            {existing ? (
              <Button type="button" variant="destructive" className="sm:mr-auto" onClick={handleClear}>
                Clear Slot
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{existing ? "Save Changes" : "Assign"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
