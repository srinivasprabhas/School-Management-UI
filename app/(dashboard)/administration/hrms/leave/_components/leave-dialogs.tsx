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
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/format"
import type { UnifiedLeaveRow } from "./types"

interface LeaveDecisionDialogProps {
  row: UnifiedLeaveRow | null
  decision: "approved" | "rejected" | null
  onOpenChange: (open: boolean) => void
  onConfirm: (row: UnifiedLeaveRow, decision: "approved" | "rejected", note: string) => void
}

export function LeaveDecisionDialog({ row, decision, onOpenChange, onConfirm }: LeaveDecisionDialogProps) {
  const [note, setNote] = useState("")
  const [pending, setPending] = useState(false)
  const open = !!row && !!decision

  useEffect(() => {
    if (open) setNote("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{decision === "approved" ? "Approve leave request?" : "Reject leave request?"}</DialogTitle>
          <DialogDescription>
            {row
              ? `${row.staffName} — ${row.leaveType} leave, ${formatDate(row.fromDate)} to ${formatDate(row.toDate)} (${row.daysCount}d).`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="leaveNote">Note (optional)</FieldLabel>
          <Textarea
            id="leaveNote"
            placeholder={decision === "approved" ? "Add an optional approval note…" : "Add an optional reason…"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={decision === "rejected" ? "destructive" : "default"}
            disabled={pending}
            onClick={() => {
              if (!row || !decision) return
              setPending(true)
              onConfirm(row, decision, note)
              setPending(false)
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {decision === "approved" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface LeaveViewDialogProps {
  row: UnifiedLeaveRow | null
  onOpenChange: (open: boolean) => void
}

export function LeaveViewDialog({ row, onOpenChange }: LeaveViewDialogProps) {
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Request Details</DialogTitle>
          <DialogDescription>{row?.staffName}</DialogDescription>
        </DialogHeader>
        {row ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{row.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Leave Type</span>
              <span className="font-medium capitalize">{row.leaveType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span className="font-medium">
                {formatDate(row.fromDate)} – {formatDate(row.toDate)} ({row.daysCount}d)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Applied On</span>
              <span className="font-medium">{formatDate(row.appliedDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge label={row.status} tone={toneForStatus(row.status)} className="capitalize" />
            </div>
            {row.approvedBy ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Actioned By</span>
                <span className="font-medium">{row.approvedBy}</span>
              </div>
            ) : null}
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-muted-foreground">Reason</span>
              <p className="rounded-md bg-muted p-2">{row.reason}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
