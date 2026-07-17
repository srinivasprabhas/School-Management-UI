"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  BadgePercentIcon,
  GraduationCapIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { ChartCard } from "@/components/shared/chart-card"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAcademicSession,
  useAdmissionLeads,
  useAttendance,
  useClassSections,
  useExams,
  useFeeTransactions,
  useMarks,
  useStudents,
  useSubjects,
} from "@/lib/data/store/entities"
import { SEED_TODAY } from "@/lib/data/seed/generate"

const enrollmentConfig: ChartConfig = {
  students: { label: "Students", color: "var(--chart-1)" },
}
const feeTargetConfig: ChartConfig = {
  target: { label: "Target", color: "var(--chart-3)" },
  collected: { label: "Collected", color: "var(--chart-2)" },
}
const attendanceByClassConfig: ChartConfig = {
  rate: { label: "Attendance %", color: "var(--chart-2)" },
}
const examBySubjectConfig: ChartConfig = {
  avgScore: { label: "Avg Score %", color: "var(--chart-1)" },
}
const admissionsFunnelConfig: ChartConfig = {
  count: { label: "Leads" },
}
const staffPerfConfig: ChartConfig = {
  value: { label: "Staff Attendance %", color: "var(--chart-1)" },
}

const STAGE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" })
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function rateOf(records: { status: string }[]) {
  if (!records.length) return 0
  const present = records.filter((r) => r.status === "present" || r.status === "late").length
  return (present / records.length) * 100
}

function windowTrend(records: { date: string; status: string }[]) {
  const dates = [...new Set(records.map((r) => r.date))].sort()
  const last7 = new Set(dates.slice(-7))
  const prev7 = new Set(dates.slice(-14, -7))
  const current = rateOf(records.filter((r) => last7.has(r.date)))
  const previous = rateOf(records.filter((r) => prev7.has(r.date)))
  return { current: round1(current), previous: round1(previous) }
}

export function AnalyticsContent() {
  const { items: students } = useStudents()
  const { items: attendance } = useAttendance()
  const { items: feeTransactions } = useFeeTransactions()
  const { items: marks } = useMarks()
  const { items: exams } = useExams()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const { items: admissionLeads } = useAdmissionLeads()
  const { value: academicSession } = useAcademicSession()

  const [year, setYear] = useState(academicSession.year)
  const [term, setTerm] = useState(academicSession.terms[0]?.id ?? "")

  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  // --- Enrollment growth & trend --------------------------------------
  const enrollment = useMemo(() => {
    const countAsOf = (date: Date) =>
      students.filter((s) => new Date(s.admissionDate) <= date).length
    const now = countAsOf(SEED_TODAY)
    const sixMoAgo = countAsOf(new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - 6, SEED_TODAY.getDate()))
    const growthPct = sixMoAgo > 0 ? round1(((now - sixMoAgo) / sixMoAgo) * 100) : 0

    const trend: { month: string; students: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
      const monthEnd = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i + 1, 0)
      trend.push({ month: monthLabel(monthDate), students: countAsOf(monthEnd) })
    }
    return { growthPct, trend }
  }, [students])

  // --- Fee collection efficiency & trend -------------------------------
  const fee = useMemo(() => {
    const totalDue = feeTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const totalPaid = feeTransactions.reduce((sum, t) => sum + t.paidAmount, 0)
    const efficiency = totalDue > 0 ? round1((totalPaid / totalDue) * 100) : 0

    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
    const effOf = (txs: typeof feeTransactions) => {
      const due = txs.reduce((sum, t) => sum + t.totalAmount, 0)
      const paid = txs.reduce((sum, t) => sum + t.paidAmount, 0)
      return due > 0 ? (paid / due) * 100 : 0
    }
    const thisMonthKey = monthKey(SEED_TODAY)
    const lastMonthDate = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - 1, 1)
    const lastMonthKey = monthKey(lastMonthDate)
    const thisMonthEff = effOf(feeTransactions.filter((t) => monthKey(new Date(t.dueDate)) === thisMonthKey))
    const lastMonthEff = effOf(feeTransactions.filter((t) => monthKey(new Date(t.dueDate)) === lastMonthKey))

    const buckets = new Map<string, { target: number; collected: number }>()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
      buckets.set(monthLabel(monthDate), { target: 0, collected: 0 })
    }
    feeTransactions.forEach((t) => {
      const key = monthLabel(new Date(t.dueDate))
      const bucket = buckets.get(key)
      if (!bucket) return
      bucket.target += t.totalAmount
      bucket.collected += t.paidAmount
    })
    const vsTarget = [...buckets.entries()].map(([month, v]) => ({ month, ...v }))

    return { efficiency, thisMonthEff, lastMonthEff, vsTarget }
  }, [feeTransactions])

  // --- Attendance (student) avg + trend + by class ---------------------
  const studentAttendance = useMemo(() => attendance.filter((a) => a.personType === "student"), [attendance])
  const staffAttendanceRecords = useMemo(() => attendance.filter((a) => a.personType === "staff"), [attendance])

  const studentAttendanceTrend = useMemo(() => windowTrend(studentAttendance), [studentAttendance])
  const staffAttendanceTrend = useMemo(() => windowTrend(staffAttendanceRecords), [staffAttendanceRecords])

  const attendanceByClass = useMemo(() => {
    const byStudentId = new Map(students.map((s) => [s.id, s.classSectionId]))
    const buckets = new Map<string, { present: number; total: number }>()
    studentAttendance.forEach((a) => {
      const classSectionId = byStudentId.get(a.personId)
      const section = classSectionId ? classSectionsById.get(classSectionId) : undefined
      if (!section) return
      const label = `${section.className} ${section.section}`
      const bucket = buckets.get(label) ?? { present: 0, total: 0 }
      bucket.total += 1
      if (a.status === "present" || a.status === "late") bucket.present += 1
      buckets.set(label, bucket)
    })
    return [...buckets.entries()]
      .map(([className, { present, total }]) => ({
        className,
        rate: total ? round1((present / total) * 100) : 0,
      }))
      .sort((a, b) => (a.className < b.className ? -1 : 1))
  }, [studentAttendance, students, classSectionsById])

  // --- Academic score avg + trend + by subject --------------------------
  const academic = useMemo(() => {
    const graded = [...exams]
      .filter((e) => e.status === "published" || e.status === "completed")
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
    const examAvg = (examId: string) => {
      const ms = marks.filter((m) => m.examId === examId && !m.isAbsent)
      if (!ms.length) return 0
      return ms.reduce((sum, m) => sum + m.marksObtained, 0) / ms.length
    }
    const latest = graded[graded.length - 1]
    const previous = graded[graded.length - 2]
    const avgScore = latest ? round1(examAvg(latest.id)) : 0
    const prevAvgScore = previous ? round1(examAvg(previous.id)) : undefined

    const bySubject = new Map<string, number[]>()
    if (latest) {
      marks
        .filter((m) => m.examId === latest.id && !m.isAbsent)
        .forEach((m) => {
          const list = bySubject.get(m.subjectId) ?? []
          list.push(m.marksObtained)
          bySubject.set(m.subjectId, list)
        })
    }
    const byClass = new Map<string, number[]>()
    if (latest) {
      const byStudentId = new Map(students.map((s) => [s.id, s.classSectionId]))
      const scoresByStudent = new Map<string, number[]>()
      marks
        .filter((m) => m.examId === latest.id && !m.isAbsent)
        .forEach((m) => {
          const list = scoresByStudent.get(m.studentId) ?? []
          list.push(m.marksObtained)
          scoresByStudent.set(m.studentId, list)
        })
      scoresByStudent.forEach((scores, studentId) => {
        const sectionId = byStudentId.get(studentId)
        const section = sectionId ? classSectionsById.get(sectionId) : undefined
        if (!section) return
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        const label = `${section.className} ${section.section}`
        const list = byClass.get(label) ?? []
        list.push(avg)
        byClass.set(label, list)
      })
    }

    const subjectChart = [...bySubject.entries()]
      .map(([subjectId, scores]) => ({
        subject: subjectsById.get(subjectId)?.name ?? subjectId,
        avgScore: round1(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)

    const classRanking = [...byClass.entries()]
      .map(([className, scores]) => ({
        className,
        avgScore: round1(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)

    return { avgScore, prevAvgScore, subjectChart, classRanking, latestExamName: latest?.name }
  }, [exams, marks, students, classSectionsById, subjectsById])

  // --- Admissions funnel --------------------------------------------------
  const admissionsFunnel = useMemo(() => {
    const stages = ["inquiry", "application", "interview", "offer", "enrolled", "rejected"] as const
    const counts = new Map(stages.map((s) => [s, 0]))
    admissionLeads.forEach((lead) => counts.set(lead.stage, (counts.get(lead.stage) ?? 0) + 1))
    return stages
      .map((stage, i) => ({ stage, count: counts.get(stage) ?? 0, fill: STAGE_COLORS[i % STAGE_COLORS.length] }))
      .filter((d) => d.count > 0)
  }, [admissionLeads])

  const staffAttendancePct = round1(rateOf(staffAttendanceRecords))
  const staffRadialData = [{ name: "Staff Attendance", value: staffAttendancePct, fill: "var(--color-value)" }]

  const topClasses = academic.classRanking.slice(0, 3)
  const bottomClasses = [...academic.classRanking].reverse().slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" description="Leadership BI dashboard — cross-module insights, view only." />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={year} onValueChange={(v) => setYear(v ?? academicSession.year)}>
          <SelectTrigger size="sm" className="h-8 w-40">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={academicSession.year}>{academicSession.year}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={term} onValueChange={(v) => setTerm(v ?? term)}>
          <SelectTrigger size="sm" className="h-8 w-40">
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            {academicSession.terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Enrollment Growth"
          value={`${enrollment.growthPct >= 0 ? "+" : ""}${enrollment.growthPct}%`}
          icon={UsersIcon}
          description="vs. 6 months ago"
        />
        <StatCard
          title="Fee Collection Efficiency"
          value={`${fee.efficiency}%`}
          icon={WalletIcon}
          trend={{
            value: Math.abs(round1(fee.thisMonthEff - fee.lastMonthEff)),
            direction: fee.thisMonthEff >= fee.lastMonthEff ? "up" : "down",
            label: "vs. last month",
          }}
        />
        <StatCard
          title="Avg Attendance"
          value={`${studentAttendanceTrend.current}%`}
          icon={UserCheckIcon}
          trend={{
            value: Math.abs(round1(studentAttendanceTrend.current - studentAttendanceTrend.previous)),
            direction: studentAttendanceTrend.current >= studentAttendanceTrend.previous ? "up" : "down",
            label: "vs. last week",
          }}
        />
        <StatCard
          title="Avg Academic Score"
          value={`${academic.avgScore}%`}
          icon={GraduationCapIcon}
          trend={
            academic.prevAvgScore !== undefined
              ? {
                  value: Math.abs(round1(academic.avgScore - academic.prevAvgScore)),
                  direction: academic.avgScore >= academic.prevAvgScore ? "up" : "down",
                  label: "vs. previous exam",
                }
              : undefined
          }
        />
        <StatCard
          title="Staff Attendance"
          value={`${staffAttendanceTrend.current}%`}
          icon={BadgePercentIcon}
          trend={{
            value: Math.abs(round1(staffAttendanceTrend.current - staffAttendanceTrend.previous)),
            direction: staffAttendanceTrend.current >= staffAttendanceTrend.previous ? "up" : "down",
            label: "vs. last week",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Enrollment Trend" description="Cumulative active enrollment, last 12 months" config={enrollmentConfig}>
          <AreaChart data={enrollment.trend} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="students" type="monotone" fill="var(--color-students)" fillOpacity={0.2} stroke="var(--color-students)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Fee Collection vs Target" description="Target (total due) vs. collected, last 6 months" config={feeTargetConfig}>
          <BarChart data={fee.vsTarget} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="target" fill="var(--color-target)" radius={4} />
            <Bar dataKey="collected" fill="var(--color-collected)" radius={4} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Attendance by Class" description="Present rate across all recorded school days" config={attendanceByClassConfig}>
          <BarChart data={attendanceByClass} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="className" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-35} textAnchor="end" height={50} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="rate" fill="var(--color-rate)" radius={4} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Exam Performance by Subject"
          description={academic.latestExamName ? `Average marks — ${academic.latestExamName}` : "Average marks by subject"}
          config={examBySubjectConfig}
        >
          <BarChart data={academic.subjectChart} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-35} textAnchor="end" height={50} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={4} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Admissions Funnel" description="Leads by stage" config={admissionsFunnelConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={admissionsFunnel} dataKey="count" nameKey="stage" innerRadius={55} outerRadius={85} strokeWidth={2}>
              {admissionsFunnel.map((entry) => (
                <Cell key={entry.stage} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>

        <ChartCard title="Staff Performance" description="Avg staff attendance rate" config={staffPerfConfig}>
          <RadialBarChart
            data={staffRadialData}
            innerRadius="60%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid gridType="circle" radialLines={false} stroke="none" />
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </RadialBarChart>
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <TrendingUpIcon className="size-4" />
            Class Performance Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Top Performing</span>
            {topClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exam data available.</p>
            ) : (
              topClasses.map((c) => (
                <div key={c.className} className="flex items-center justify-between text-sm">
                  <span>{c.className}</span>
                  <span className="font-medium text-success">{c.avgScore}%</span>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Needs Attention</span>
            {bottomClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exam data available.</p>
            ) : (
              bottomClasses.map((c) => (
                <div key={c.className} className="flex items-center justify-between text-sm">
                  <span>{c.className}</span>
                  <span className="font-medium text-warning">{c.avgScore}%</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
