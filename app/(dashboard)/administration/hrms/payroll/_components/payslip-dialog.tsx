"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import type { PayrollRecord } from "@/lib/data/types"

interface PayslipDialogProps {
  record: PayrollRecord | null
  onOpenChange: (open: boolean) => void
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasis ? "text-base font-semibold" : "font-medium"}>{value}</span>
    </div>
  )
}

export function PayslipDialog({ record, onOpenChange }: PayslipDialogProps) {
  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payslip</DialogTitle>
          <DialogDescription>
            {record?.staffName} · {record?.period}
          </DialogDescription>
        </DialogHeader>
        {record ? (
          <div className="flex flex-col gap-3">
            <Row label="Basic Salary" value={formatCurrency(record.basicSalary)} />
            <Row label="Allowances" value={`+ ${formatCurrency(record.allowances)}`} />
            <Row label="Deductions" value={`- ${formatCurrency(record.deductions)}`} />
            <Separator />
            <Row label="Net Pay" value={formatCurrency(record.netPay)} emphasis />
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge label={record.status} tone={toneForStatus(record.status)} className="capitalize" />
            </div>
            {record.paymentDate ? <Row label="Payment Date" value={formatDate(record.paymentDate)} /> : null}
            {record.paymentMode ? (
              <Row label="Payment Mode" value={record.paymentMode.replace("_", " ")} />
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
