"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { Candidate } from "@/lib/data/types"

interface ScheduleInterviewDialogProps {
  candidate: Candidate | null
  onOpenChange: (open: boolean) => void
  onConfirm: (candidate: Candidate, interviewDate: string) => void
}

export function ScheduleInterviewDialog({ candidate, onOpenChange, onConfirm }: ScheduleInterviewDialogProps) {
  const [date, setDate] = useState(toISODate(SEED_TODAY))

  useEffect(() => {
    if (candidate) setDate(candidate.interviewDate ?? toISODate(SEED_TODAY))
  }, [candidate])

  return (
    <Dialog open={!!candidate} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>{candidate?.name}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="interviewDate">Interview date</FieldLabel>
          <Input id="interviewDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!candidate) return
              onConfirm(candidate, date)
            }}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
