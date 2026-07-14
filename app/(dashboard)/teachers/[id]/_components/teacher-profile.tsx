"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CheckIcon,
  FileTextIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { HorizontalScroller } from "@/components/shared/horizontal-scroller"
import { StatusBadge, toneBgClass, toneForStatus } from "@/components/shared/status-badge"
import { DataTable } from "@/components/shared/data-table/data-table"
import { createActionsColumn, type RowAction } from "@/components/shared/data-table/columns-helpers"
import { formatCurrency, formatDate, initials } from "@/lib/format"
import { useLogActivity } from "@/lib/data/audit"
import {
  useAttendance,
  useClassSections,
  useStudents,
  useSubjects,
  useTeachers,
  useTimetable,
} from "@/lib/data/store/entities"
import type { AssignedClass, TeacherLeaveEntry } from "@/lib/data/types"
import { TeacherFormSheet } from "../../_components/teacher-form-sheet"
import { AssignClassDialog } from "../../_components/assign-class-dialog"

const DAYS: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"> = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
const LEAVE_TYPES: TeacherLeaveEntry["type"][] = ["sick", "casual", "earned", "maternity", "paternity", "unpaid"]

export function TeacherProfile({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const { items: teachers, update, remove } = useTeachers()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const { items: students } = useStudents()
  const { items: attendance } = useAttendance()
  const { items: timetable } = useTimetable()
  const logActivity = useLogActivity()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false)
  const [leaveType, setLeaveType] = useState<TeacherLeaveEntry["type"]>("sick")
  const [leaveFrom, setLeaveFrom] = useState("")
  const [leaveTo, setLeaveTo] = useState("")
  const [leaveReason, setLeaveReason] = useState("")
  const [leaveActionTarget, setLeaveActionTarget] = useState<{
    entry: TeacherLeaveEntry
    action: "approve" | "reject"
  } | null>(null)

  const teacher = teachers.find((t) => t.id === teacherId)

  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  const teacherAttendance = useMemo(
    () => attendance.filter((a) => a.personType === "staff" && a.personId === teacherId),
    [attendance, teacherId]
  )
  const attendancePct = teacherAttendance.length
    ? Math.round(
        (teacherAttendance.filter((a) => a.status === "present" || a.status === "late").length /
          teacherAttendance.length) *
          100
      )
    : 0

  const teacherTimetable = useMemo(
    () => timetable.filter((slot) => slot.teacherId === teacherId),
    [timetable, teacherId]
  )

  const pendingLeaveCount = teacher?.leaveHistory.filter((l) => l.status === "pending").length ?? 0

  const assignedClassColumns: ColumnDef<AssignedClass>[] = [
    {
      id: "classSection",
      header: "Class - Section",
      cell: ({ row }) => {
        const cs = classSectionsById.get(row.original.classSectionId)
        return cs ? `${cs.className} — ${cs.section}` : "—"
      },
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => <span className="capitalize">{row.original.role.replace("_", " ")}</span>,
    },
    {
      id: "subject",
      header: "Subject",
      cell: ({ row }) => subjectsById.get(row.original.subjectId)?.name ?? "—",
    },
    {
      id: "studentCount",
      header: "Student Count",
      cell: ({ row }) => students.filter((s) => s.classSectionId === row.original.classSectionId).length,
    },
  ]

  const leaveColumns: ColumnDef<TeacherLeaveEntry>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span>,
    },
    {
      accessorKey: "fromDate",
      header: "From",
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      accessorKey: "toDate",
      header: "To",
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    { accessorKey: "days", header: "Days" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
    },
    {
      accessorKey: "appliedOn",
      header: "Applied On",
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      accessorKey: "approvedBy",
      header: "Approved By",
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    createActionsColumn<TeacherLeaveEntry>([
      {
        label: "Approve",
        icon: CheckIcon,
        onSelect: (l) => setLeaveActionTarget({ entry: l, action: "approve" }),
        hidden: (l) => l.status !== "pending",
      },
      {
        label: "Reject",
        icon: XIcon,
        variant: "destructive",
        onSelect: (l) => setLeaveActionTarget({ entry: l, action: "reject" }),
        hidden: (l) => l.status !== "pending",
      },
    ] satisfies RowAction<TeacherLeaveEntry>[]),
  ]

  if (!teacher) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="Teacher not found"
        description="This teacher record may have been removed."
        action={
          <Button render={<Link href="/teachers" />} nativeButton={false}>
            Back to Teachers
          </Button>
        }
      />
    )
  }

  function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault()
    if (!teacher) return
    if (!leaveFrom || !leaveTo) {
      toast.error("Please select both from and to dates.")
      return
    }
    const days =
      Math.round((new Date(leaveTo).getTime() - new Date(leaveFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (days < 1) {
      toast.error("The to date must be on or after the from date.")
      return
    }
    const entry: TeacherLeaveEntry = {
      id: `leave_${teacher.id}_${teacher.leaveHistory.length}`,
      type: leaveType,
      fromDate: leaveFrom,
      toDate: leaveTo,
      days,
      reason: leaveReason,
      status: "pending",
      appliedOn: new Date().toISOString().slice(0, 10),
    }
    update(teacher.id, { leaveHistory: [...teacher.leaveHistory, entry] })
    logActivity({
      action: "update",
      module: "Teachers",
      entityType: "Teacher",
      entityId: teacher.id,
      description: `${teacher.firstName} ${teacher.lastName} applied for ${leaveType} leave`,
    })
    toast.success("Leave application submitted")
    setApplyLeaveOpen(false)
    setLeaveType("sick")
    setLeaveFrom("")
    setLeaveTo("")
    setLeaveReason("")
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden py-0">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary" />
        <CardContent className="flex flex-col gap-4 pt-0 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
            <Avatar className="-mt-10 size-20 ring-4 ring-background">
              <AvatarFallback className="text-lg">
                {initials(`${teacher.firstName} ${teacher.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  {teacher.firstName} {teacher.lastName}
                </h1>
                <StatusBadge label={teacher.status} tone={toneForStatus(teacher.status)} className="capitalize" />
              </div>
              <p className="text-sm text-muted-foreground">
                {teacher.designation} · {teacher.department} · Employee ID {teacher.employeeId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilIcon data-icon="inline-start" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <LayersIcon data-icon="inline-start" />
              Assign Class
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {teacher.status === "active" ? (
                  <DropdownMenuItem
                    onClick={() => {
                      update(teacher.id, { status: "inactive" })
                      toast.success("Teacher deactivated")
                    }}
                  >
                    <PowerIcon />
                    Deactivate
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
        <div className="grid grid-cols-2 divide-x border-t sm:grid-cols-4">
          {[
            { label: "Attendance", value: `${attendancePct}%` },
            { label: "Classes Assigned", value: String(teacher.assignedClasses.length) },
            { label: "Experience", value: `${teacher.experienceYears} yrs` },
            { label: "Pending Leaves", value: String(pendingLeaveCount) },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 p-4 text-center">
              <span className="text-lg font-semibold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <HorizontalScroller>
          <TabsList className="w-max">
            <TabsTrigger value="overview" className="shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="classes" className="shrink-0">Classes & Subjects</TabsTrigger>
            <TabsTrigger value="timetable" className="shrink-0">Timetable</TabsTrigger>
            <TabsTrigger value="attendance" className="shrink-0">Attendance</TabsTrigger>
            <TabsTrigger value="leave" className="shrink-0">Leave History</TabsTrigger>
            <TabsTrigger value="salary" className="shrink-0">Salary</TabsTrigger>
            <TabsTrigger value="documents" className="shrink-0">Documents</TabsTrigger>
          </TabsList>
        </HorizontalScroller>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Date of Birth" value={formatDate(teacher.dob)} />
                <DetailRow label="Gender" value={teacher.gender} className="capitalize" />
                <DetailRow label="Join Date" value={formatDate(teacher.joinDate)} />
                <DetailRow label="Emergency Contact" value={teacher.emergencyContact} />
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Qualifications</span>
                  <div className="flex flex-wrap gap-1">
                    {teacher.qualifications.length ? (
                      teacher.qualifications.map((q) => (
                        <Badge key={q} variant="outline">
                          {q}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm">None recorded</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Phone" value={teacher.phone} />
                <DetailRow label="Email" value={teacher.email || "—"} />
                <DetailRow
                  label="Address"
                  value={`${teacher.address.line1}, ${teacher.address.city}, ${teacher.address.state} ${teacher.address.pincode}`}
                  className="col-span-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subjects Taught</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {teacher.subjectIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects assigned.</p>
              ) : (
                teacher.subjectIds.map((id) => (
                  <Badge key={id} variant="outline">
                    {subjectsById.get(id)?.name ?? id}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Assigned Classes</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Assign Class
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={assignedClassColumns}
                data={teacher.assignedClasses}
                emptyTitle="No classes assigned"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    {DAYS.map((day) => (
                      <TableHead key={day}>{day}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERIODS.map((period) => (
                    <TableRow key={period}>
                      <TableCell className="font-medium text-muted-foreground">Period {period}</TableCell>
                      {DAYS.map((day) => {
                        const slot = teacherTimetable.find((s) => s.day === day && s.period === period)
                        const section = slot ? classSectionsById.get(slot.classSectionId) : undefined
                        return (
                          <TableCell key={day} className="whitespace-normal">
                            {slot ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">
                                  {subjectsById.get(slot.subjectId)?.name ?? slot.subjectId}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {section ? `${section.className} ${section.section}` : ""}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {teacherAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {[...teacherAttendance]
                    .sort((a, b) => (a.date < b.date ? -1 : 1))
                    .map((record) => (
                      <div
                        key={record.id}
                        title={`${formatDate(record.date)} — ${record.status}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-medium ${toneBgClass(toneForStatus(record.status))}`}
                      >
                        {new Date(record.date).getDate()}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-4 flex flex-col gap-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setApplyLeaveOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Apply Leave
            </Button>
          </div>
          <DataTable columns={leaveColumns} data={teacher.leaveHistory} emptyTitle="No leave records" />
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Salary Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <DetailRow label="Basic Pay" value={formatCurrency(teacher.salary.basic)} />
              <DetailRow label="Allowances" value={formatCurrency(teacher.salary.allowances)} />
              <DetailRow label="Deductions" value={formatCurrency(teacher.salary.deductions)} />
              <DetailRow label="Net Salary" value={formatCurrency(teacher.salary.netSalary)} />
              <DetailRow label="Pay Grade" value={teacher.salary.payGrade} />
              <DetailRow label="Bank Account" value={teacher.salary.bankAccountMasked} />
              <DetailRow label="Last Paid Date" value={formatDate(teacher.salary.lastPaidDate)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Documents</CardTitle>
              <Button variant="outline" size="sm" onClick={() => toast.info("Upload UI is a demo mock")}>
                <UploadIcon data-icon="inline-start" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              {teacher.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {teacher.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(doc.uploadedDate)}</p>
                        </div>
                      </div>
                      <StatusBadge
                        label={doc.verified ? "Verified" : "Pending"}
                        tone={doc.verified ? "success" : "warning"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TeacherFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        teacher={teacher}
        onSubmit={(updated) => update(teacher.id, updated)}
      />

      <AssignClassDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        teacher={teacher}
        onSubmit={(assignedClasses) => update(teacher.id, { assignedClasses })}
      />

      <Dialog open={applyLeaveOpen} onOpenChange={setApplyLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Leave</DialogTitle>
            <DialogDescription>
              Submit a leave application on behalf of {teacher.firstName} {teacher.lastName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplyLeave} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="leaveType">Leave type</FieldLabel>
              <Select value={leaveType} onValueChange={(v) => setLeaveType(v as TeacherLeaveEntry["type"])}>
                <SelectTrigger id="leaveType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="leaveFrom">From</FieldLabel>
                <Input id="leaveFrom" type="date" required value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="leaveTo">To</FieldLabel>
                <Input id="leaveTo" type="date" required value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="leaveReason">Reason</FieldLabel>
              <Textarea
                id="leaveReason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Reason for leave"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setApplyLeaveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!leaveActionTarget}
        onOpenChange={(open) => !open && setLeaveActionTarget(null)}
        title={leaveActionTarget?.action === "approve" ? "Approve leave request?" : "Reject leave request?"}
        description={
          leaveActionTarget
            ? `${leaveActionTarget.entry.type} leave from ${formatDate(leaveActionTarget.entry.fromDate)} to ${formatDate(leaveActionTarget.entry.toDate)} (${leaveActionTarget.entry.days} day(s)).`
            : ""
        }
        confirmLabel={leaveActionTarget?.action === "approve" ? "Approve" : "Reject"}
        variant={leaveActionTarget?.action === "reject" ? "destructive" : "default"}
        onConfirm={() => {
          if (!leaveActionTarget) return
          const { entry, action } = leaveActionTarget
          const newStatus = action === "approve" ? "approved" : "rejected"
          update(teacher.id, {
            leaveHistory: teacher.leaveHistory.map((l) =>
              l.id === entry.id ? { ...l, status: newStatus, approvedBy: "Current User" } : l
            ),
          })
          logActivity({
            action: "update",
            module: "Teachers",
            entityType: "Teacher",
            entityId: teacher.id,
            description: `${action === "approve" ? "Approved" : "Rejected"} ${entry.type} leave for ${teacher.firstName} ${teacher.lastName}`,
          })
          toast.success(`Leave ${newStatus}`)
          setLeaveActionTarget(null)
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete teacher record?"
        description={`This will permanently remove ${teacher.firstName} ${teacher.lastName}'s record. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          remove(teacher.id)
          logActivity({
            action: "delete",
            module: "Teachers",
            entityType: "Teacher",
            entityId: teacher.id,
            description: `Deleted teacher ${teacher.firstName} ${teacher.lastName}`,
          })
          toast.success("Teacher deleted")
          router.push("/teachers")
        }}
      />
    </div>
  )
}

function DetailRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  )
}
