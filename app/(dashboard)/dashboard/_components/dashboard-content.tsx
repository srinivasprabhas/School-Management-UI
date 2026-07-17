"use client"

import { useMemo } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  BusIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import { StatCard } from "@/components/shared/stat-card"
import { ChartCard } from "@/components/shared/chart-card"
import { toneBgClass, type StatusTone } from "@/components/shared/status-badge"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import {
  useAnnouncements,
  useAttendance,
  useClassSections,
  useFeeTransactions,
  useLeaveRequests,
  useMarks,
  useExams,
  useStudents,
  useTeachers,
  useVehicles,
} from "@/lib/data/store/entities"
import { QUICK_ACTIONS } from "@/lib/nav/quick-actions"
import { SEED_TODAY, gradeFor } from "@/lib/data/seed/generate"
import { toISODate } from "@/lib/data/seed/random"
import { cn } from "@/lib/utils"

const studentGrowthConfig: ChartConfig = {
  students: { label: "This Year", color: "var(--chart-1)" },
  lastYear: { label: "Last Year", color: "var(--chart-4)" },
}
const attendanceTrendConfig: ChartConfig = {
  rate: { label: "Attendance %", color: "var(--chart-2)" },
}
const feeCollectionConfig: ChartConfig = {
  collected: { label: "Collected", color: "var(--chart-2)" },
  pending: { label: "Pending", color: "var(--chart-3)" },
}
const admissionConfig: ChartConfig = {
  admissions: { label: "New Admissions", color: "var(--chart-1)" },
}
const examPerformanceConfig: ChartConfig = {
  excellent: { label: "Excellent (80-100%)", color: "var(--chart-2)" },
  good: { label: "Good (60-79%)", color: "var(--chart-1)" },
  average: { label: "Average (40-59%)", color: "var(--chart-3)" },
  needsImprovement: { label: "Needs Improvement (<40%)", color: "var(--chart-5)" },
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" })
}

interface ActivityEntry {
  id: string
  type: "admission" | "fee" | "attendance" | "leave" | "announcement"
  title: string
  description: string
  date: string
}

export function DashboardContent() {
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const { items: attendance } = useAttendance()
  const { items: vehicles } = useVehicles()
  const { items: classSections } = useClassSections()
  const { items: feeTransactions } = useFeeTransactions()
  const { items: exams } = useExams()
  const { items: marks } = useMarks()
  const { items: leaveRequests } = useLeaveRequests()
  const { items: announcements } = useAnnouncements()

  const activeStudents = students.filter((s) => s.status === "active")
  const activeTeachers = teachers.filter((t) => t.status === "active")
  const todayStr = toISODate(SEED_TODAY)
  const todayAttendance = attendance.filter((a) => a.personType === "student" && a.date === todayStr)
  const presentToday = todayAttendance.filter((a) => a.status === "present" || a.status === "late").length
  const attendancePct = todayAttendance.length ? Math.round((presentToday / todayAttendance.length) * 100) : 0
  const activeVehicles = vehicles.filter((v) => v.status === "active")

  const studentGrowth = useMemo(() => {
    const points: { month: string; students: number; lastYear: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
      const monthEnd = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i + 1, 0)
      const priorMonthEnd = new Date(SEED_TODAY.getFullYear() - 1, SEED_TODAY.getMonth() - i + 1, 0)
      const count = students.filter((s) => new Date(s.admissionDate) <= monthEnd).length
      const priorCount = students.filter((s) => new Date(s.admissionDate) <= priorMonthEnd).length
      points.push({ month: monthLabel(monthDate), students: count, lastYear: priorCount })
    }
    return points
  }, [students])

  const attendanceTrend = useMemo(() => {
    const byDate = new Map<string, { present: number; total: number }>()
    attendance
      .filter((a) => a.personType === "student")
      .forEach((a) => {
        const bucket = byDate.get(a.date) ?? { present: 0, total: 0 }
        bucket.total += 1
        if (a.status === "present" || a.status === "late") bucket.present += 1
        byDate.set(a.date, bucket)
      })
    return [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-14)
      .map(([date, { present, total }]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rate: total ? Math.round((present / total) * 100) : 0,
      }))
  }, [attendance])

  const feeCollection = useMemo(() => {
    const buckets = new Map<string, { collected: number; pending: number }>()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
      buckets.set(monthLabel(monthDate), { collected: 0, pending: 0 })
    }
    feeTransactions.forEach((tx) => {
      const monthDate = new Date(tx.dueDate)
      const key = monthLabel(monthDate)
      const bucket = buckets.get(key)
      if (!bucket) return
      if (tx.status === "paid") bucket.collected += tx.paidAmount
      else bucket.pending += tx.balance
    })
    return [...buckets.entries()].map(([month, v]) => ({ month, ...v }))
  }, [feeTransactions])

  const admissionStats = useMemo(() => {
    const byClass = new Map<string, number>()
    classSections.forEach((cs) => byClass.set(cs.className, 0))
    students.forEach((s) => {
      const section = classSections.find((cs) => cs.id === s.classSectionId)
      if (!section) return
      byClass.set(section.className, (byClass.get(section.className) ?? 0) + 1)
    })
    return [...byClass.entries()]
      .filter(([, count]) => count > 0)
      .map(([className, admissions]) => ({ className, admissions }))
  }, [students, classSections])

  const examPerformance = useMemo(() => {
    const latestExam = [...exams]
      .filter((e) => e.status === "published" || e.status === "completed")
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0]
    if (!latestExam) return []

    const examMarks = marks.filter((m) => m.examId === latestExam.id && !m.isAbsent)
    const byStudent = new Map<string, number[]>()
    examMarks.forEach((m) => {
      const list = byStudent.get(m.studentId) ?? []
      list.push(m.marksObtained)
      byStudent.set(m.studentId, list)
    })

    const byClass = new Map<
      string,
      { excellent: number; good: number; average: number; needsImprovement: number }
    >()
    byStudent.forEach((scores, studentId) => {
      const student = students.find((s) => s.id === studentId)
      const section = classSections.find((cs) => cs.id === student?.classSectionId)
      if (!section) return
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      const bucket =
        byClass.get(section.className) ??
        { excellent: 0, good: 0, average: 0, needsImprovement: 0 }
      if (avg >= 80) bucket.excellent += 1
      else if (avg >= 60) bucket.good += 1
      else if (avg >= 40) bucket.average += 1
      else bucket.needsImprovement += 1
      byClass.set(section.className, bucket)
    })

    return [...byClass.entries()].map(([className, v]) => ({ className, ...v }))
  }, [exams, marks, students, classSections])

  const recentActivity = useMemo<ActivityEntry[]>(() => {
    const admissionEntries: ActivityEntry[] = [...students]
      .sort((a, b) => (a.admissionDate < b.admissionDate ? 1 : -1))
      .slice(0, 4)
      .map((s) => ({
        id: `act_adm_${s.id}`,
        type: "admission",
        title: "New admission",
        description: `${s.firstName} ${s.lastName} was admitted (${s.admissionNo})`,
        date: s.admissionDate,
      }))

    const feeEntries: ActivityEntry[] = feeTransactions
      .filter((tx) => tx.status === "paid" && tx.transactionDate)
      .sort((a, b) => ((a.transactionDate ?? "") < (b.transactionDate ?? "") ? 1 : -1))
      .slice(0, 4)
      .map((tx) => {
        const student = students.find((s) => s.id === tx.studentId)
        return {
          id: `act_fee_${tx.id}`,
          type: "fee",
          title: "Fee payment received",
          description: `₹${tx.paidAmount.toLocaleString()} from ${student ? `${student.firstName} ${student.lastName}` : "a student"}`,
          date: tx.transactionDate ?? tx.dueDate,
        } satisfies ActivityEntry
      })

    const leaveEntries: ActivityEntry[] = leaveRequests
      .filter((lr) => lr.status === "pending")
      .sort((a, b) => (a.appliedDate < b.appliedDate ? 1 : -1))
      .slice(0, 3)
      .map((lr) => ({
        id: `act_leave_${lr.id}`,
        type: "leave",
        title: "Leave request",
        description: `${lr.staffName} requested ${lr.leaveType} leave (${lr.daysCount}d)`,
        date: lr.appliedDate,
      }))

    const announcementEntries: ActivityEntry[] = announcements
      .filter((a) => a.status === "published")
      .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1))
      .slice(0, 3)
      .map((a) => ({
        id: `act_ann_${a.id}`,
        type: "announcement",
        title: "New announcement",
        description: a.title,
        date: a.publishDate,
      }))

    return [...admissionEntries, ...feeEntries, ...leaveEntries, ...announcementEntries]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8)
  }, [students, feeTransactions, leaveRequests, announcements])

  const QUICK_ACTION_TONE: Record<string, string> = {
    "add-student": "text-success",
    "add-teacher": "text-primary",
    "take-attendance": "text-info",
    "collect-fee": "text-success",
    "create-notice": "text-destructive",
    "schedule-exam": "text-warning",
    "generate-report": "text-info",
  }

  const ACTIVITY_META: Record<ActivityEntry["type"], { icon: typeof UserPlusIcon; tone: StatusTone }> = {
    admission: { icon: UserPlusIcon, tone: "success" },
    fee: { icon: WalletIcon, tone: "info" },
    attendance: { icon: CalendarCheckIcon, tone: "warning" },
    leave: { icon: CalendarClockIcon, tone: "neutral" },
    announcement: { icon: MegaphoneIcon, tone: "destructive" },
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — here&apos;s what&apos;s happening at your school today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={activeStudents.length}
          icon={UsersIcon}
          variant="primary"
          description={`${students.length} total records`}
        />
        <StatCard
          title="Total Teachers"
          value={activeTeachers.length}
          icon={GraduationCapIcon}
          variant="success"
          description={`${teachers.length} total records`}
        />
        <StatCard
          title="Today's Attendance"
          value={`${attendancePct}%`}
          icon={CalendarCheckIcon}
          variant={attendancePct >= 90 ? "success" : attendancePct >= 75 ? "warning" : "destructive"}
          description={`${presentToday} of ${todayAttendance.length} present`}
        />
        <StatCard
          title="Active Buses"
          value={`${activeVehicles.length}/${vehicles.length}`}
          icon={BusIcon}
          variant="warning"
          description="Running today"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          title="Student Growth"
          description="Cumulative enrollment — this year vs. last year"
          config={studentGrowthConfig}
          className="lg:col-span-3"
        >
          <AreaChart data={studentGrowth} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="lastYear"
              type="monotone"
              fill="var(--color-lastYear)"
              fillOpacity={0.12}
              stroke="var(--color-lastYear)"
              strokeDasharray="4 4"
            />
            <Area
              dataKey="students"
              type="monotone"
              fill="var(--color-students)"
              fillOpacity={0.25}
              stroke="var(--color-students)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartCard>

        <Card className="flex h-full flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid flex-1 grid-cols-2 content-start gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto flex-col items-start gap-1 whitespace-normal p-3 text-left"
                render={<Link href={action.href} />}
                nativeButton={false}
              >
                <action.icon className={cn("size-4", QUICK_ACTION_TONE[action.id])} />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Fee Collection"
          description="Collected vs. pending, last 6 months"
          config={feeCollectionConfig}
        >
          <BarChart data={feeCollection} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="collected" stackId="fees" fill="var(--color-collected)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="pending" stackId="fees" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Admission Statistics"
          description="Enrolled students by class"
          config={admissionConfig}
        >
          <BarChart data={admissionStats} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="className" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-35} textAnchor="end" height={50} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="admissions" fill="var(--color-admissions)" radius={4} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          title="Exam Performance"
          description="Latest published exam — grade distribution by class"
          config={examPerformanceConfig}
          className="lg:col-span-3"
        >
          <BarChart data={examPerformance} layout="vertical" margin={{ left: 12, right: 12 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="className" tickLine={false} axisLine={false} width={70} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="excellent" stackId="perf" fill="var(--color-excellent)" radius={[4, 0, 0, 4]} />
            <Bar dataKey="good" stackId="perf" fill="var(--color-good)" />
            <Bar dataKey="average" stackId="perf" fill="var(--color-average)" />
            <Bar dataKey="needsImprovement" stackId="perf" fill="var(--color-needsImprovement)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Attendance Trends"
          description="Daily attendance percentage (last 14 school days)"
          config={attendanceTrendConfig}
          className="lg:col-span-2"
        >
          <LineChart data={attendanceTrend} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="rate" type="monotone" stroke="var(--color-rate)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <ItemGroup>
              {recentActivity.map((entry) => {
                const meta = ACTIVITY_META[entry.type]
                const Icon = meta.icon
                return (
                  <Item key={entry.id} size="sm">
                    <ItemMedia variant="icon" className={toneBgClass(meta.tone)}>
                      <Icon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{entry.title}</ItemTitle>
                      <ItemDescription>{entry.description}</ItemDescription>
                    </ItemContent>
                    <span className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                    </span>
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
