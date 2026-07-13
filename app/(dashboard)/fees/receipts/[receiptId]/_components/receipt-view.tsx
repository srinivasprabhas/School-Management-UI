"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeftIcon, DownloadIcon, PrinterIcon, ReceiptIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { useClassSections, useFeeTransactions, useSchoolProfile, useStudents } from "@/lib/data/store/entities"
import { MOCK_USERS } from "@/lib/rbac/mock-users"

export function ReceiptView({ receiptId }: { receiptId: string }) {
  const router = useRouter()
  const { items: transactions } = useFeeTransactions()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const { value: school } = useSchoolProfile()

  const tx = transactions.find((t) => t.id === receiptId)
  const student = students.find((s) => s.id === tx?.studentId)
  const section = classSections.find((cs) => cs.id === student?.classSectionId)

  if (!tx || !student) {
    return (
      <EmptyState
        icon={ReceiptIcon}
        title="Receipt not found"
        description="This fee transaction record may have been removed."
        action={
          <Button render={<Link href="/fees" />} nativeButton={false}>
            Back to Fees
          </Button>
        }
      />
    )
  }

  const collectedByName = tx.collectedBy
    ? (MOCK_USERS.find((u) => u.id === tx.collectedBy)?.name ?? tx.collectedBy)
    : "—"

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 print:max-w-full">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.push("/fees")}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to Fees
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" />
            Print
          </Button>
          <Button
            onClick={() =>
              toast.success("Receipt downloaded", {
                description: `${tx.receiptNo || tx.id}.pdf saved (mock).`,
              })
            }
          >
            <DownloadIcon data-icon="inline-start" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:ring-0">
        <CardHeader className="flex flex-col items-center gap-1 border-b text-center">
          <h2 className="font-heading text-lg font-semibold">{school.name}</h2>
          <p className="text-xs text-muted-foreground">{school.address}</p>
          <p className="text-xs text-muted-foreground">
            {school.phone} · {school.email}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Receipt No.</p>
              <p className="font-medium">{tx.receiptNo || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(tx.transactionDate ?? tx.dueDate)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Student Name</p>
              <p className="font-medium">
                {student.firstName} {student.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admission No.</p>
              <p className="font-medium">{student.admissionNo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class</p>
              <p className="font-medium">{section ? `${section.className} — ${section.section}` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Academic Year</p>
              <p className="font-medium">{tx.academicYear}</p>
            </div>
          </div>

          <Separator />

          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {tx.items.map((item, i) => (
                  <tr key={`${item.categoryId}_${i}`} className="border-b last:border-0">
                    <td className="py-2">{item.label}</td>
                    <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto flex w-full max-w-56 flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(tx.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatCurrency(tx.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fine</span>
              <span>+{formatCurrency(tx.fine)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-medium">
              <span>Paid Amount</span>
              <span>{formatCurrency(tx.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Balance</span>
              <span>{formatCurrency(tx.balance)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Payment Mode</p>
              <p className="font-medium capitalize">{tx.mode?.replace("_", " ") ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Collected By</p>
              <p className="font-medium">{collectedByName}</p>
            </div>
            <StatusBadge label={tx.status} tone={toneForStatus(tx.status)} className="capitalize" />
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t text-xs text-muted-foreground">
          This is a computer-generated receipt and does not require a signature.
        </CardFooter>
      </Card>
    </div>
  )
}
