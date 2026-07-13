"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/format"
import type { AuditLogEntry } from "@/lib/data/types"

interface AuditDetailDialogProps {
  entry: AuditLogEntry | null
  onOpenChange: (open: boolean) => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function AuditDetailDialog({ entry, onOpenChange }: AuditDetailDialogProps) {
  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Audit Log Entry</DialogTitle>
          <DialogDescription>Immutable system activity record.</DialogDescription>
        </DialogHeader>
        {entry ? (
          <div className="flex flex-col gap-2">
            <Row label="Actor" value={`${entry.actorName} (${entry.actorRole.replace("_", " ")})`} />
            <Row
              label="Action"
              value={<StatusBadge label={entry.action.replace("_", " ")} tone={toneForStatus(entry.action)} className="capitalize" />}
            />
            <Row label="Module" value={entry.module} />
            <Row label="Entity" value={entry.entityId ? `${entry.entityType} (${entry.entityId})` : entry.entityType} />
            <Row label="Timestamp" value={`${formatDate(entry.timestamp)} · ${new Date(entry.timestamp).toLocaleTimeString()}`} />
            <Row label="IP Address" value={<span className="font-mono">{entry.ipAddress}</span>} />
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-muted-foreground">Description</span>
              <p className="rounded-md bg-muted p-2 text-sm">{entry.description}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
