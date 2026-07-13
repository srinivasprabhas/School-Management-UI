"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { useAuditLog } from "@/lib/data/store/entities"
import type { AuditLogEntry } from "@/lib/data/types"
import { buildAuditColumns } from "./columns"
import { AuditDetailDialog } from "./audit-detail-dialog"

const ACTION_OPTIONS: AuditLogEntry["action"][] = [
  "create",
  "update",
  "delete",
  "login",
  "export",
  "permission_change",
]

export function AuditLogContent() {
  const { items: logs } = useAuditLog()

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [actionType, setActionType] = useState("all")
  const [actorFilter, setActorFilter] = useState("all")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [viewingEntry, setViewingEntry] = useState<AuditLogEntry | null>(null)

  const actorOptions = useMemo(() => [...new Set(logs.map((l) => l.actorName))].sort(), [logs])
  const moduleOptions = useMemo(() => [...new Set(logs.map((l) => l.module))].sort(), [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const day = log.timestamp.slice(0, 10)
      if (dateFrom && day < dateFrom) return false
      if (dateTo && day > dateTo) return false
      if (actionType !== "all" && log.action !== actionType) return false
      if (actorFilter !== "all" && log.actorName !== actorFilter) return false
      if (moduleFilter !== "all" && log.module !== moduleFilter) return false
      return true
    })
  }, [logs, dateFrom, dateTo, actionType, actorFilter, moduleFilter])

  const columns = useMemo(() => buildAuditColumns({ onViewDetails: (e) => setViewingEntry(e) }), [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable trail of system activity. Entries cannot be edited or deleted."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Export started", { description: `Exporting ${filteredLogs.length} log entries…` })
            }
          >
            <DownloadIcon data-icon="inline-start" />
            Export All
          </Button>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field>
            <FieldLabel htmlFor="dateFrom">From</FieldLabel>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="dateTo">To</FieldLabel>
            <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="actionType">Action Type</FieldLabel>
            <Select value={actionType} onValueChange={(v) => setActionType(v ?? "all")}>
              <SelectTrigger id="actionType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a} className="capitalize">
                    {a.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="userFilter">User</FieldLabel>
            <Select value={actorFilter} onValueChange={(v) => setActorFilter(v ?? "all")}>
              <SelectTrigger id="userFilter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {actorOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="moduleFilter">Module</FieldLabel>
            <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v ?? "all")}>
              <SelectTrigger id="moduleFilter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {moduleOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredLogs}
        searchKey="description"
        searchPlaceholder="Search descriptions…"
        emptyTitle="No audit log entries found"
        emptyDescription="Try adjusting your filters."
      />

      <AuditDetailDialog entry={viewingEntry} onOpenChange={(open) => !open && setViewingEntry(null)} />
    </div>
  )
}
