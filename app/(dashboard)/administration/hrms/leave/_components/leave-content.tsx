"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarCheckIcon, CalendarClockIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"

import { DataTable } from "@/components/shared/data-table/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { useLeaveRequests, useTeachers } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { toISODate } from "@/lib/data/seed/random"
import { buildLeaveColumns } from "./columns"
import { LeaveDecisionDialog, LeaveViewDialog } from "./leave-dialogs"
import type { UnifiedLeaveRow } from "./types"

const TODAY_STR = toISODate(SEED_TODAY)
const CURRENT_MONTH_KEY = TODAY_STR.slice(0, 7) // "YYYY-MM"

export function LeaveContent() {
  const { items: leaveRequests, update: updateLeaveRequest } = useLeaveRequests()
  const { items: teachers, update: updateTeacher } = useTeachers()
  const { user } = useCurrentUser()
  const logActivity = useLogActivity()

  const [viewingRow, setViewingRow] = useState<UnifiedLeaveRow | null>(null)
  const [decisionRow, setDecisionRow] = useState<UnifiedLeaveRow | null>(null)
  const [decisionType, setDecisionType] = useState<"approved" | "rejected" | null>(null)

  const unifiedRows = useMemo<UnifiedLeaveRow[]>(() => {
    const fromStaffStore: UnifiedLeaveRow[] = leaveRequests.map((lr) => ({
      id: lr.id,
      source: "staff",
      sourceId: lr.staffId,
      originalId: lr.id,
      staffName: lr.staffName,
      role: lr.role,
      leaveType: lr.leaveType,
      fromDate: lr.fromDate,
      toDate: lr.toDate,
      daysCount: lr.daysCount,
      reason: lr.reason,
      status: lr.status,
      appliedDate: lr.appliedDate,
      approvedBy: lr.approvedBy,
      approvedDate: lr.approvedDate,
    }))

    // Teachers carry their own embedded leave history — flattened here so this page
    // is a truly unified view across both the standalone staff-leave store and the
    // per-teacher leaveHistory arrays (not just one source).
    const fromTeachers: UnifiedLeaveRow[] = teachers.flatMap((t) =>
      t.leaveHistory.map((entry) => ({
        id: `tchlv_${t.id}_${entry.id}`,
        source: "teacher" as const,
        sourceId: t.id,
        originalId: entry.id,
        staffName: `${t.firstName} ${t.lastName}`,
        role: "Teacher",
        leaveType: entry.type,
        fromDate: entry.fromDate,
        toDate: entry.toDate,
        daysCount: entry.days,
        reason: entry.reason,
        status: entry.status,
        appliedDate: entry.appliedOn,
        approvedBy: entry.approvedBy,
        approvedDate: undefined,
      }))
    )

    return [...fromStaffStore, ...fromTeachers].sort((a, b) => (a.appliedDate < b.appliedDate ? 1 : -1))
  }, [leaveRequests, teachers])

  const stats = useMemo(() => {
    const pending = unifiedRows.filter((r) => r.status === "pending").length
    const onLeaveToday = unifiedRows.filter(
      (r) => r.status === "approved" && r.fromDate <= TODAY_STR && TODAY_STR <= r.toDate
    ).length
    const approvedThisMonth = unifiedRows.filter(
      (r) => r.status === "approved" && (r.approvedDate ?? r.appliedDate).slice(0, 7) === CURRENT_MONTH_KEY
    ).length
    const rejectedThisMonth = unifiedRows.filter(
      (r) => r.status === "rejected" && (r.approvedDate ?? r.appliedDate).slice(0, 7) === CURRENT_MONTH_KEY
    ).length
    return { pending, onLeaveToday, approvedThisMonth, rejectedThisMonth }
  }, [unifiedRows])

  function applyDecision(row: UnifiedLeaveRow, decision: "approved" | "rejected", note: string) {
    const approvedDate = toISODate(SEED_TODAY)
    if (row.source === "staff") {
      updateLeaveRequest(row.originalId, {
        status: decision,
        approvedBy: user.name,
        approvedDate,
        ...(note ? { reason: `${row.reason} — ${note}` } : {}),
      })
    } else {
      const teacher = teachers.find((t) => t.id === row.sourceId)
      if (!teacher) return
      updateTeacher(teacher.id, {
        leaveHistory: teacher.leaveHistory.map((entry) =>
          entry.id === row.originalId
            ? { ...entry, status: decision, approvedBy: user.name, reason: note ? `${entry.reason} — ${note}` : entry.reason }
            : entry
        ),
      })
    }
    logActivity({
      action: "update",
      module: "HRMS",
      entityType: "LeaveRequest",
      entityId: row.originalId,
      description: `${decision === "approved" ? "Approved" : "Rejected"} ${row.leaveType} leave for ${row.staffName}`,
    })
    toast.success(decision === "approved" ? "Leave approved" : "Leave rejected", {
      description: `${row.staffName} — ${formatRange(row)}`,
    })
    setDecisionRow(null)
    setDecisionType(null)
  }

  function formatRange(row: UnifiedLeaveRow) {
    return `${row.fromDate} to ${row.toDate}`
  }

  const columns = useMemo(
    () =>
      buildLeaveColumns({
        onApprove: (row) => {
          setDecisionRow(row)
          setDecisionType("approved")
        },
        onReject: (row) => {
          setDecisionRow(row)
          setDecisionType("rejected")
        },
        onView: (row) => setViewingRow(row),
      }),
    []
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leave Management"
        description="Unified view of staff and teacher leave requests."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Pending" value={stats.pending} icon={CalendarClockIcon} variant="warning" />
        <StatCard title="On Leave Today" value={stats.onLeaveToday} icon={CalendarCheckIcon} />
        <StatCard title="Approved This Month" value={stats.approvedThisMonth} icon={CheckCircleIcon} variant="success" />
        <StatCard title="Rejected This Month" value={stats.rejectedThisMonth} icon={XCircleIcon} variant="destructive" />
      </div>

      <DataTable
        columns={columns}
        data={unifiedRows}
        searchKey="staff"
        searchPlaceholder="Search by staff name…"
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ],
          },
          {
            columnId: "leaveType",
            title: "Leave Type",
            options: [
              { label: "Sick", value: "sick" },
              { label: "Casual", value: "casual" },
              { label: "Earned", value: "earned" },
              { label: "Maternity", value: "maternity" },
              { label: "Paternity", value: "paternity" },
              { label: "Unpaid", value: "unpaid" },
            ],
          },
        ]}
        emptyTitle="No leave requests found"
        emptyDescription="Try adjusting your filters."
      />

      <LeaveDecisionDialog
        row={decisionRow}
        decision={decisionType}
        onOpenChange={(open) => {
          if (!open) {
            setDecisionRow(null)
            setDecisionType(null)
          }
        }}
        onConfirm={applyDecision}
      />

      <LeaveViewDialog row={viewingRow} onOpenChange={(open) => !open && setViewingRow(null)} />
    </div>
  )
}
