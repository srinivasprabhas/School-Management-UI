"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BanknoteIcon, CheckCircleIcon, ClockIcon, WalletIcon } from "lucide-react"

import { DataTable } from "@/components/shared/data-table/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { usePayroll } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { toISODate } from "@/lib/data/seed/random"
import { formatCurrency } from "@/lib/format"
import type { PayrollRecord } from "@/lib/data/types"
import { buildPayrollColumns } from "./columns"
import { PayslipDialog } from "./payslip-dialog"

export function PayrollContent() {
  const { items: payroll, update } = usePayroll()
  const logActivity = useLogActivity()

  const [payslipRecord, setPayslipRecord] = useState<PayrollRecord | null>(null)
  const [markingPaid, setMarkingPaid] = useState<PayrollRecord | null>(null)

  const latestPeriod = useMemo(() => {
    if (payroll.length === 0) return undefined
    return [...payroll].sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()
    )[0].period
  }, [payroll])

  const stats = useMemo(() => {
    const current = payroll.filter((p) => p.period === latestPeriod)
    const total = current.reduce((sum, p) => sum + p.netPay, 0)
    const processed = current.filter((p) => p.status === "processed").length
    const pending = current.filter((p) => p.status === "pending").length
    const avg = current.length ? Math.round(total / current.length) : 0
    return { total, processed, pending, avg }
  }, [payroll, latestPeriod])

  const periodOptions = useMemo(() => {
    const periods = [...new Set(payroll.map((p) => p.period))]
    return periods.map((p) => ({ label: p, value: p }))
  }, [payroll])

  const columns = useMemo(
    () =>
      buildPayrollColumns({
        onViewPayslip: (r) => setPayslipRecord(r),
        onMarkPaid: (r) => setMarkingPaid(r),
        onDownload: (r) =>
          toast.success("Payslip download started", {
            description: `${r.staffName} — ${r.period}`,
          }),
      }),
    []
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll"
        description={latestPeriod ? `Latest processed period: ${latestPeriod}.` : "Staff payroll."}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payroll This Month"
          value={formatCurrency(stats.total)}
          icon={BanknoteIcon}
          description={latestPeriod}
        />
        <StatCard title="Processed" value={stats.processed} icon={CheckCircleIcon} variant="success" />
        <StatCard title="Pending" value={stats.pending} icon={ClockIcon} variant="warning" />
        <StatCard title="Avg Salary" value={formatCurrency(stats.avg)} icon={WalletIcon} />
      </div>

      <DataTable
        columns={columns}
        data={payroll}
        searchKey="staff"
        searchPlaceholder="Search by staff name…"
        filters={[
          { columnId: "period", title: "Period", options: periodOptions },
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Processed", value: "processed" },
              { label: "Paid", value: "paid" },
            ],
          },
        ]}
        emptyTitle="No payroll records found"
        emptyDescription="Try adjusting your filters."
      />

      <PayslipDialog record={payslipRecord} onOpenChange={(open) => !open && setPayslipRecord(null)} />

      <ConfirmDialog
        open={!!markingPaid}
        onOpenChange={(open) => !open && setMarkingPaid(null)}
        title="Mark payroll as paid?"
        description={`This will mark ${markingPaid?.staffName}'s ${markingPaid?.period} payroll as paid.`}
        confirmLabel="Mark as Paid"
        onConfirm={() => {
          if (!markingPaid) return
          update(markingPaid.id, { status: "paid", paymentDate: toISODate(SEED_TODAY) })
          logActivity({
            action: "update",
            module: "HRMS",
            entityType: "PayrollRecord",
            entityId: markingPaid.id,
            description: `Marked payroll as paid for ${markingPaid.staffName} (${markingPaid.period})`,
          })
          toast.success("Payroll marked as paid")
          setMarkingPaid(null)
        }}
      />
    </div>
  )
}
