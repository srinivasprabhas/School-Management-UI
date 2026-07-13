"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import {
  ArrowRightIcon,
  AwardIcon,
  CalendarClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  MessageCircleIcon,
  PercentIcon,
  Trash2Icon,
  UserCheckIcon,
  XIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { ChartCard } from "@/components/shared/chart-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { useAdmissionLeads } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { formatDate, initials } from "@/lib/format"
import { toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { MOCK_USERS } from "@/lib/rbac/mock-users"
import type { AdmissionLead } from "@/lib/data/types"
import {
  ADMISSION_STAGE_LABEL,
  admissionStageTone,
  nextAdmissionStage,
} from "./admission-stage"

const SOURCE_LABEL: Record<AdmissionLead["source"], string> = {
  website: "Website",
  referral: "Referral",
  walk_in: "Walk-in",
  social_media: "Social Media",
  event: "Event",
}

const SOURCE_CHART_CONFIG: ChartConfig = {
  website: { label: "Website", color: "var(--chart-1)" },
  referral: { label: "Referral", color: "var(--chart-2)" },
  walk_in: { label: "Walk-in", color: "var(--chart-3)" },
  social_media: { label: "Social Media", color: "var(--chart-4)" },
  event: { label: "Event", color: "var(--chart-5)" },
}

const APPLICATIONS_CHART_CONFIG: ChartConfig = {
  count: { label: "New Applications", color: "var(--chart-1)" },
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" })
}

function buildLeadColumns(args: {
  assignedToName: (id?: string) => string
  onAdvance: (lead: AdmissionLead) => void
  onSchedule: (lead: AdmissionLead) => void
  onConvert: (lead: AdmissionLead) => void
  onReject: (lead: AdmissionLead) => void
  onDelete: (lead: AdmissionLead) => void
}): ColumnDef<AdmissionLead>[] {
  const actions: RowAction<AdmissionLead>[] = [
    {
      label: "Move to Next Stage",
      icon: ArrowRightIcon,
      onSelect: args.onAdvance,
      hidden: (l) => l.stage === "enrolled" || l.stage === "rejected",
    },
    {
      label: "Schedule Interview",
      icon: CalendarClockIcon,
      onSelect: args.onSchedule,
      hidden: (l) => l.stage === "enrolled" || l.stage === "rejected",
    },
    {
      label: "Convert to Student",
      icon: UserCheckIcon,
      onSelect: args.onConvert,
      hidden: (l) => l.stage === "rejected",
    },
    {
      label: "Reject",
      icon: XIcon,
      variant: "destructive",
      onSelect: args.onReject,
      hidden: (l) => l.stage === "rejected" || l.stage === "enrolled",
      separatorBefore: true,
    },
    { label: "Delete", icon: Trash2Icon, variant: "destructive", onSelect: args.onDelete },
  ]

  return [
    createSelectColumn<AdmissionLead>(),
    {
      id: "applicant",
      accessorFn: (l) => l.applicantName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applicant" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initials(row.original.applicantName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.applicantName}</span>
            <span className="text-xs text-muted-foreground">{row.original.parentName}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "applyingForClass",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applying For" />,
      cell: ({ getValue }) => <Badge variant="outline">{getValue<string>()}</Badge>,
    },
    {
      accessorKey: "source",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ getValue }) => <Badge variant="secondary">{SOURCE_LABEL[getValue<AdmissionLead["source"]>()]}</Badge>,
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      accessorKey: "stage",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
      cell: ({ getValue }) => {
        const stage = getValue<AdmissionLead["stage"]>()
        return <StatusBadge label={ADMISSION_STAGE_LABEL[stage]} tone={admissionStageTone(stage)} />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "assignedTo",
      accessorFn: (l) => args.assignedToName(l.assignedTo),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned To" />,
    },
    {
      accessorKey: "lastActivityDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Activity" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    createActionsColumn<AdmissionLead>(actions),
  ]
}

export function AdmissionsContent() {
  const router = useRouter()
  const { items: leads, update, remove } = useAdmissionLeads()
  const logActivity = useLogActivity()

  const [schedulingLead, setSchedulingLead] = useState<AdmissionLead | null>(null)
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewTime, setInterviewTime] = useState("10:00")

  const [rejectingLead, setRejectingLead] = useState<AdmissionLead | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const [deletingLead, setDeletingLead] = useState<AdmissionLead | null>(null)

  const usersById = useMemo(() => new Map(MOCK_USERS.map((u) => [u.id, u.name])), [])
  const assignedToName = useCallback(
    (id?: string) => (id ? usersById.get(id) ?? id : "Unassigned"),
    [usersById]
  )

  const funnel = useMemo(() => {
    const byStage = (stage: AdmissionLead["stage"]) => leads.filter((l) => l.stage === stage).length
    const enrolled = byStage("enrolled")
    return {
      inquiry: byStage("inquiry"),
      application: byStage("application"),
      interview: byStage("interview"),
      offer: byStage("offer"),
      enrolled,
      conversionPct: leads.length ? Math.round((enrolled / leads.length) * 100) : 0,
    }
  }, [leads])

  const applicationsOverTime = useMemo(() => {
    const points: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i, 1)
      const monthEnd = new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth() - i + 1, 0)
      const count = leads.filter((l) => {
        const created = new Date(l.createdDate)
        return created >= monthDate && created <= monthEnd
      }).length
      points.push({ month: monthLabel(monthDate), count })
    }
    return points
  }, [leads])

  const bySource = useMemo(() => {
    const counts = new Map<AdmissionLead["source"], number>()
    leads.forEach((l) => counts.set(l.source, (counts.get(l.source) ?? 0) + 1))
    return [...counts.entries()].map(([source, count]) => ({ source, count }))
  }, [leads])

  const columns = useMemo(
    () =>
      buildLeadColumns({
        assignedToName,
        onAdvance: (lead) => {
          const next = nextAdmissionStage(lead.stage)
          update(lead.id, { stage: next, lastActivityDate: toISODate(SEED_TODAY) })
          toast.success(`Moved to ${ADMISSION_STAGE_LABEL[next]}`)
        },
        onSchedule: (lead) => {
          setSchedulingLead(lead)
          setInterviewDate(lead.interviewDate?.slice(0, 10) ?? toISODate(SEED_TODAY))
          setInterviewTime("10:00")
        },
        onConvert: (lead) => {
          toast.success("Redirecting to Add Student", {
            description: `Starting enrollment for ${lead.applicantName}.`,
          })
          router.push("/students?action=add")
        },
        onReject: (lead) => {
          setRejectingLead(lead)
          setRejectReason("")
        },
        onDelete: (lead) => setDeletingLead(lead),
      }),
    [assignedToName, update, router]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Admissions" description="Track leads from first inquiry through enrollment." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Inquiries" value={funnel.inquiry} icon={MessageCircleIcon} />
        <StatCard title="Applications" value={funnel.application} icon={FileTextIcon} />
        <StatCard title="Interviews Scheduled" value={funnel.interview} icon={CalendarClockIcon} />
        <StatCard title="Offers" value={funnel.offer} icon={AwardIcon} />
        <StatCard title="Enrolled" value={funnel.enrolled} icon={GraduationCapIcon} variant="success" />
        <StatCard title="Conversion %" value={`${funnel.conversionPct}%`} icon={PercentIcon} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Applications over time"
          description="New leads created per month (last 6 months)"
          config={APPLICATIONS_CHART_CONFIG}
        >
          <AreaChart data={applicationsOverTime} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="count"
              type="monotone"
              fill="var(--color-count)"
              fillOpacity={0.2}
              stroke="var(--color-count)"
            />
          </AreaChart>
        </ChartCard>

        <ChartCard title="By Source" description="Where leads are coming from" config={SOURCE_CHART_CONFIG}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={bySource} dataKey="count" nameKey="source" innerRadius={50} outerRadius={90} strokeWidth={2}>
              {bySource.map((entry) => (
                <Cell key={entry.source} fill={`var(--color-${entry.source})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        data={leads}
        searchKey="applicant"
        searchPlaceholder="Search by applicant name…"
        filters={[
          {
            columnId: "stage",
            title: "Stage",
            options: Object.entries(ADMISSION_STAGE_LABEL).map(([value, label]) => ({ label, value })),
          },
          {
            columnId: "source",
            title: "Source",
            options: Object.entries(SOURCE_LABEL).map(([value, label]) => ({ label, value })),
          },
        ]}
        emptyTitle="No admission leads"
        emptyDescription="New inquiries will show up here."
      />

      <Dialog open={!!schedulingLead} onOpenChange={(open) => !open && setSchedulingLead(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>{schedulingLead?.applicantName}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="interviewDate">Date</FieldLabel>
                <Input
                  id="interviewDate"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="interviewTime">Time</FieldLabel>
                <Input
                  id="interviewTime"
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulingLead(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!schedulingLead) return
                update(schedulingLead.id, {
                  interviewDate: `${interviewDate}T${interviewTime}:00`,
                  stage: schedulingLead.stage === "inquiry" ? "application" : schedulingLead.stage,
                  lastActivityDate: toISODate(SEED_TODAY),
                })
                toast.success("Interview scheduled", { description: `${interviewDate} at ${interviewTime}` })
                setSchedulingLead(null)
              }}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectingLead} onOpenChange={(open) => !open && setRejectingLead(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject application?</DialogTitle>
            <DialogDescription>
              {rejectingLead?.applicantName} will be marked as rejected in the pipeline.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="rejectReason">Reason (optional)</FieldLabel>
            <Textarea
              id="rejectReason"
              placeholder="Add a note explaining the rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingLead(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectingLead) return
                update(rejectingLead.id, {
                  stage: "rejected",
                  notes: rejectReason.trim() || rejectingLead.notes,
                  lastActivityDate: toISODate(SEED_TODAY),
                })
                logActivity({
                  action: "update",
                  module: "Admissions",
                  entityType: "AdmissionLead",
                  entityId: rejectingLead.id,
                  description: `Rejected application from ${rejectingLead.applicantName}`,
                })
                toast.success("Application rejected")
                setRejectingLead(null)
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingLead}
        onOpenChange={(open) => !open && setDeletingLead(null)}
        title="Delete lead?"
        description={`This will permanently remove ${deletingLead?.applicantName}'s admission record. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingLead) return
          remove(deletingLead.id)
          logActivity({
            action: "delete",
            module: "Admissions",
            entityType: "AdmissionLead",
            entityId: deletingLead.id,
            description: `Deleted admission lead ${deletingLead.applicantName}`,
          })
          toast.success("Lead deleted")
          setDeletingLead(null)
        }}
      />
    </div>
  )
}
