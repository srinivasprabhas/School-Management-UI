"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  ClockIcon,
  WalletIcon,
} from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { ChartCard } from "@/components/shared/chart-card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useLogActivity } from "@/lib/data/audit"
import {
  useAcademicSession,
  useFeeCategories,
  useFeeInstallments,
  useFeeTransactions,
  useStudents,
} from "@/lib/data/store/entities"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { toISODate } from "@/lib/data/seed/random"
import { formatCurrency } from "@/lib/format"
import type { FeeTransaction, Student } from "@/lib/data/types"
import { PAYMENT_MODE_LABELS } from "./constants"
import { OverviewTab } from "./overview-tab"
import { TransactionsTab } from "./transactions-tab"
import { FeeStructureTab } from "./fee-structure-tab"
import { FinesTab } from "./fines-tab"

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" })
}

const collectionTrendConfig: ChartConfig = {
  collected: { label: "Collected", color: "var(--chart-2)" },
}

const paymentModeConfig: ChartConfig = {
  count: { label: "Payments", color: "var(--chart-1)" },
}

const CATEGORY_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function FeesDashboard() {
  const router = useRouter()
  const { items: transactions, update: updateTransaction } = useFeeTransactions()
  const { items: categories } = useFeeCategories()
  const { items: installments } = useFeeInstallments()
  const { items: students } = useStudents()
  const { value: session } = useAcademicSession()
  const logActivity = useLogActivity()

  const [voidingTx, setVoidingTx] = useState<FeeTransaction | null>(null)

  const studentsById = useMemo<Map<string, Student>>(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  )

  const academicYear = session.year
  const todayStr = toISODate(SEED_TODAY)

  const yearTransactions = useMemo(
    () => transactions.filter((t) => t.academicYear === academicYear),
    [transactions, academicYear]
  )

  const totalCollected = useMemo(
    () => yearTransactions.reduce((sum, t) => sum + t.paidAmount, 0),
    [yearTransactions]
  )
  const totalPending = useMemo(
    () => transactions.filter((t) => t.status === "pending").reduce((sum, t) => sum + t.balance, 0),
    [transactions]
  )
  const totalOverdue = useMemo(
    () => transactions.filter((t) => t.status === "overdue").reduce((sum, t) => sum + t.balance, 0),
    [transactions]
  )
  const dueTodayTx = useMemo(() => transactions.filter((t) => t.dueDate === todayStr), [transactions, todayStr])
  const dueTodaySum = useMemo(() => dueTodayTx.reduce((sum, t) => sum + t.balance, 0), [dueTodayTx])

  const collectionTrend = useMemo(() => {
    const points: { month: string; collected: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
      points.push({ month: monthLabel(monthDate), collected: 0 })
    }
    const byMonth = new Map(points.map((p) => [p.month, p]))
    transactions.forEach((tx) => {
      if (tx.paidAmount <= 0) return
      const dateStr = tx.transactionDate ?? tx.dueDate
      const bucket = byMonth.get(monthLabel(new Date(dateStr)))
      if (bucket) bucket.collected += tx.paidAmount
    })
    return points
  }, [transactions])

  const categoryBreakdown = useMemo(() => {
    const sums = new Map<string, number>()
    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        sums.set(item.categoryId, (sums.get(item.categoryId) ?? 0) + item.amount)
      })
    })
    return categories
      .map((cat) => ({ id: cat.id, name: cat.name, value: sums.get(cat.id) ?? 0 }))
      .filter((c) => c.value > 0)
  }, [transactions, categories])

  const categoryChartConfig = useMemo(() => {
    const config: ChartConfig = {}
    categoryBreakdown.forEach((c, i) => {
      config[c.id] = { label: c.name, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }
    })
    return config
  }, [categoryBreakdown])

  const paymentModeDistribution = useMemo(() => {
    const modes = Object.keys(PAYMENT_MODE_LABELS) as (keyof typeof PAYMENT_MODE_LABELS)[]
    const counts = new Map(modes.map((m) => [m, 0]))
    transactions.forEach((tx) => {
      if (tx.status === "paid" && tx.mode) {
        counts.set(tx.mode, (counts.get(tx.mode) ?? 0) + 1)
      }
    })
    return modes.map((m) => ({ mode: PAYMENT_MODE_LABELS[m], count: counts.get(m) ?? 0 }))
  }, [transactions])

  const collectionTarget = useMemo(() => {
    const target = installments
      .filter((fi) => fi.academicYear === academicYear)
      .reduce((sum, fi) => sum + fi.amount, 0)
    const achieved = totalCollected
    const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0
    return { target, achieved, pct }
  }, [installments, academicYear, totalCollected])

  function handleViewReceipt(tx: FeeTransaction) {
    router.push(`/fees/receipts/${tx.id}`)
  }

  function handlePrint(tx: FeeTransaction) {
    toast.success("Sending to printer…", { description: `Receipt ${tx.receiptNo || tx.id}` })
  }

  function handleVoidConfirm() {
    if (!voidingTx) return
    updateTransaction(voidingTx.id, {
      status: "pending",
      paidAmount: 0,
      balance: voidingTx.totalAmount,
      transactionDate: undefined,
    })
    logActivity({
      action: "update",
      module: "Fees",
      entityType: "FeeTransaction",
      entityId: voidingTx.id,
      description: `Voided fee transaction ${voidingTx.receiptNo || voidingTx.id}`,
    })
    toast.success("Transaction voided", { description: "Status reset to pending." })
    setVoidingTx(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fees"
        description={`Fee collection dashboard — Academic Year ${academicYear}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalCollected)}
          icon={WalletIcon}
          variant="success"
          description={`Academic year ${academicYear}`}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(totalPending)}
          icon={ClockIcon}
          variant="warning"
          description="Awaiting payment"
        />
        <StatCard
          title="Due Today"
          value={dueTodayTx.length}
          icon={CalendarClockIcon}
          description={`${formatCurrency(dueTodaySum)} outstanding`}
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(totalOverdue)}
          icon={AlertTriangleIcon}
          variant="destructive"
          description="Past due date"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Collection Trend"
          description="Fees collected over the last 12 months"
          config={collectionTrendConfig}
        >
          <AreaChart data={collectionTrend} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="collected"
              type="monotone"
              fill="var(--color-collected)"
              fillOpacity={0.2}
              stroke="var(--color-collected)"
            />
          </AreaChart>
        </ChartCard>

        <ChartCard
          title="Fee Category Breakdown"
          description="Total billed amount by category"
          config={categoryChartConfig}
          footer={
            categoryBreakdown.length ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {categoryBreakdown.map((c) => (
                  <span key={c.id} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: `var(--color-${c.id})` }}
                    />
                    {c.name} · {formatCurrency(c.value)}
                  </span>
                ))}
              </div>
            ) : undefined
          }
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={categoryBreakdown}
              dataKey="value"
              nameKey="id"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={2}
            >
              {categoryBreakdown.map((entry) => (
                <Cell key={entry.id} fill={`var(--color-${entry.id})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Payment Mode Distribution"
          description="Paid transactions by payment mode"
          config={paymentModeConfig}
        >
          <BarChart data={paymentModeDistribution} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mode" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartCard>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Collection Target</CardTitle>
            <CardDescription>Collected vs. total billable for {academicYear}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center gap-4 py-6">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-semibold tracking-tight">{collectionTarget.pct}%</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(collectionTarget.achieved)} / {formatCurrency(collectionTarget.target)}
              </span>
            </div>
            <Progress value={collectionTarget.pct} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="structure">Fee Structure</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            transactions={transactions}
            studentsById={studentsById}
            onView={handleViewReceipt}
            onPrint={handlePrint}
            onVoid={setVoidingTx}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionsTab
            transactions={transactions}
            studentsById={studentsById}
            onView={handleViewReceipt}
            onPrint={handlePrint}
            onVoid={setVoidingTx}
          />
        </TabsContent>

        <TabsContent value="structure" className="mt-4">
          <FeeStructureTab />
        </TabsContent>

        <TabsContent value="fines" className="mt-4">
          <FinesTab />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!voidingTx}
        onOpenChange={(open) => !open && setVoidingTx(null)}
        title="Void this transaction?"
        description={`This will reset receipt ${voidingTx?.receiptNo || voidingTx?.id} back to pending and clear the recorded payment. This action cannot be undone.`}
        confirmLabel="Void Transaction"
        variant="destructive"
        onConfirm={handleVoidConfirm}
      />
    </div>
  )
}
