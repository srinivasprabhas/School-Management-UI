"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2Icon, UserSearchIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { useLogActivity } from "@/lib/data/audit"
import { useClassSections, useFeeTransactions, useStudents } from "@/lib/data/store/entities"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { toISODate } from "@/lib/data/seed/random"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { formatCurrency, formatDate, initials } from "@/lib/format"
import type { FeeTransaction, PaymentMode } from "@/lib/data/types"
import { PAYMENT_MODE_OPTIONS } from "../../_components/constants"

interface StudentOption {
  value: string
  label: string
}

function fineFor(tx: FeeTransaction): number {
  if (tx.fine > 0) return tx.fine
  if (tx.status === "overdue") return Math.round(tx.balance * 0.02)
  return 0
}

export function CollectFeeFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const { items: transactions, update: updateTransaction } = useFeeTransactions()
  const { user } = useCurrentUser()
  const logActivity = useLogActivity()

  const [studentId, setStudentId] = useState("")
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([])
  const [mode, setMode] = useState<PaymentMode>("cash")
  const [amountReceivedOverride, setAmountReceivedOverride] = useState<string | null>(null)
  const [discount, setDiscount] = useState("0")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const preselect = searchParams.get("studentId")
    if (preselect) setStudentId(preselect)
  }, [searchParams])

  const studentOptions = useMemo<StudentOption[]>(
    () =>
      students
        .filter((s) => s.status === "active")
        .map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} — ${s.admissionNo}` })),
    [students]
  )
  const selectedOption = useMemo(
    () => studentOptions.find((o) => o.value === studentId) ?? null,
    [studentOptions, studentId]
  )

  const student = students.find((s) => s.id === studentId)
  const section = classSections.find((cs) => cs.id === student?.classSectionId)

  const outstandingTx = useMemo(
    () =>
      transactions.filter(
        (t) => t.studentId === studentId && (t.status === "pending" || t.status === "overdue" || t.status === "partial")
      ),
    [transactions, studentId]
  )

  const selectedTx = useMemo(
    () => outstandingTx.filter((t) => selectedTxIds.includes(t.id)),
    [outstandingTx, selectedTxIds]
  )
  const subtotal = useMemo(() => selectedTx.reduce((sum, t) => sum + t.balance, 0), [selectedTx])
  const finesTotal = useMemo(() => selectedTx.reduce((sum, t) => sum + fineFor(t), 0), [selectedTx])
  const runningTotal = subtotal + finesTotal

  const discountNum = Number(discount) || 0
  const netDue = Math.max(0, runningTotal - discountNum)
  // Defaults to the running total due; a manual edit overrides it until the
  // selection changes again (see handleStudentChange / toggleTx below).
  const amountReceived = amountReceivedOverride ?? String(netDue)
  const amountReceivedNum = Number(amountReceived) || 0
  const changeDue = Math.max(0, amountReceivedNum - netDue)

  function handleStudentChange(option: StudentOption | null) {
    setStudentId(option?.value ?? "")
    setSelectedTxIds([])
    setAmountReceivedOverride(null)
  }

  function toggleTx(id: string, checked: boolean) {
    setSelectedTxIds((prev) => (checked ? [...prev, id] : prev.filter((t) => t !== id)))
    setAmountReceivedOverride(null)
  }

  function handleCollect() {
    if (!student) {
      toast.error("Select a student first.")
      return
    }
    if (selectedTx.length === 0) {
      toast.error("Select at least one fee transaction to collect.")
      return
    }
    setPending(true)
    const collectedDate = toISODate(SEED_TODAY)
    selectedTx.forEach((tx, i) => {
      const receiptNo = `RCT${(Date.now() + i) % 100000}`
      updateTransaction(tx.id, {
        status: "paid",
        paidAmount: tx.totalAmount,
        balance: 0,
        mode,
        transactionDate: collectedDate,
        collectedBy: user.name,
        receiptNo,
      })
      logActivity({
        action: "update",
        module: "Fees",
        entityType: "FeeTransaction",
        entityId: tx.id,
        description: `Collected fee payment of ${formatCurrency(tx.totalAmount)} from ${student.firstName} ${student.lastName}`,
      })
    })
    toast.success("Payment collected", {
      description: `${formatCurrency(runningTotal)} received from ${student.firstName} ${student.lastName}`,
    })
    setPending(false)
    router.push(`/fees/receipts/${selectedTx[0].id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Collect Fee" description="Search a student, select outstanding dues, and record payment." />

      <Card>
        <CardHeader>
          <CardTitle>Step 1 · Select Student</CardTitle>
          <CardDescription>Search by name or admission number.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Combobox items={studentOptions} value={selectedOption} onValueChange={handleStudentChange}>
            <ComboboxInput placeholder="Search by name or admission no…" className="w-full sm:w-96" />
            <ComboboxContent>
              <ComboboxEmpty>No students found.</ComboboxEmpty>
              <ComboboxList>
                {(item: StudentOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {student ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar>
                <AvatarFallback>{initials(`${student.firstName} ${student.lastName}`)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {student.firstName} {student.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {section ? `${section.className} — ${section.section}` : "Unassigned"} · Admission No.{" "}
                  {student.admissionNo}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={UserSearchIcon}
              title="No student selected"
              description="Search and select a student above to view their outstanding fees."
            />
          )}
        </CardContent>
      </Card>

      {student ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 · Outstanding Fees</CardTitle>
            <CardDescription>Select the fee transactions to collect payment for.</CardDescription>
          </CardHeader>
          <CardContent>
            {outstandingTx.length === 0 ? (
              <EmptyState
                icon={CheckCircle2Icon}
                title="No outstanding fees"
                description="This student has no pending or overdue fee transactions."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {outstandingTx.map((tx) => {
                  const fine = fineFor(tx)
                  const checked = selectedTxIds.includes(tx.id)
                  return (
                    <FieldLabel key={tx.id} htmlFor={`tx-${tx.id}`}>
                      <Field orientation="horizontal">
                        <Checkbox
                          id={`tx-${tx.id}`}
                          checked={checked}
                          onCheckedChange={(v) => toggleTx(tx.id, !!v)}
                        />
                        <FieldContent>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <FieldTitle>{tx.items.map((i) => i.label).join(", ")}</FieldTitle>
                              <FieldDescription className="flex items-center gap-1.5">
                                Due {formatDate(tx.dueDate)}
                                <StatusBadge label={tx.status} tone={toneForStatus(tx.status)} className="capitalize" />
                              </FieldDescription>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap">
                              <div className="font-medium">{formatCurrency(tx.balance)}</div>
                              {fine > 0 ? (
                                <div className="text-xs text-destructive">+{formatCurrency(fine)} fine</div>
                              ) : null}
                            </div>
                          </div>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {selectedTx.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({selectedTx.length} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fines</span>
                <span>{formatCurrency(finesTotal)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-base font-medium">
                <span>Total</span>
                <span>{formatCurrency(runningTotal)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3 · Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Field>
                <FieldLabel>Payment Mode</FieldLabel>
                <RadioGroup
                  value={mode}
                  onValueChange={(v) => v && setMode(v as PaymentMode)}
                  className="grid grid-cols-2 gap-3 sm:grid-cols-5"
                >
                  {PAYMENT_MODE_OPTIONS.map((opt) => (
                    <FieldLabel key={opt.value} htmlFor={`mode-${opt.value}`}>
                      <Field orientation="horizontal">
                        <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} />
                        <FieldContent>
                          <FieldTitle className="flex items-center gap-1.5">
                            <opt.icon className="size-4" />
                            {opt.label}
                          </FieldTitle>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="amount-received">Amount Received</FieldLabel>
                  <Input
                    id="amount-received"
                    type="number"
                    min={0}
                    value={amountReceived}
                    onChange={(e) => setAmountReceivedOverride(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="discount">Discount</FieldLabel>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </Field>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Amount Due</span>
                <span>{formatCurrency(netDue)}</span>
              </div>
              {changeDue > 0 ? (
                <div className="flex justify-between text-sm font-medium">
                  <span>Change Due</span>
                  <span>{formatCurrency(changeDue)}</span>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleCollect} disabled={pending}>
                Collect Payment
              </Button>
            </CardFooter>
          </Card>
        </>
      ) : null}
    </div>
  )
}
