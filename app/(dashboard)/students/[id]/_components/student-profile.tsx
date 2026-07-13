"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CalendarCheckIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PowerIcon,
  PrinterIcon,
  Trash2Icon,
  UploadIcon,
  WalletIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge, toneBgClass, toneForStatus } from "@/components/shared/status-badge"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { formatCurrency, formatDate, initials } from "@/lib/format"
import { useLogActivity } from "@/lib/data/audit"
import {
  useAttendance,
  useClassSections,
  useExams,
  useFeeTransactions,
  useMarks,
  useStudents,
} from "@/lib/data/store/entities"
import { gradeFor } from "@/lib/data/seed/generate"
import type { ColumnDef } from "@tanstack/react-table"
import type { FeeTransaction } from "@/lib/data/types"
import { StudentFormSheet } from "../../_components/student-form-sheet"

export function StudentProfile({ studentId }: { studentId: string }) {
  const router = useRouter()
  const { items: students, update, remove } = useStudents()
  const { items: classSections } = useClassSections()
  const { items: attendance } = useAttendance()
  const { items: feeTransactions } = useFeeTransactions()
  const { items: exams } = useExams()
  const { items: marks } = useMarks()
  const logActivity = useLogActivity()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const student = students.find((s) => s.id === studentId)
  const section = classSections.find((cs) => cs.id === student?.classSectionId)

  const studentAttendance = useMemo(
    () => attendance.filter((a) => a.personId === studentId && a.personType === "student"),
    [attendance, studentId]
  )
  const attendancePct = studentAttendance.length
    ? Math.round(
        (studentAttendance.filter((a) => a.status === "present" || a.status === "late").length /
          studentAttendance.length) *
          100
      )
    : 0

  const studentFees = useMemo(
    () => feeTransactions.filter((f) => f.studentId === studentId),
    [feeTransactions, studentId]
  )
  const feeBalance = studentFees.reduce((sum, f) => sum + f.balance, 0)

  const studentMarks = useMemo(() => marks.filter((m) => m.studentId === studentId), [marks, studentId])
  const latestExamAvg = useMemo(() => {
    const publishedExamIds = new Set(exams.filter((e) => e.status === "published").map((e) => e.id))
    const relevant = studentMarks.filter((m) => publishedExamIds.has(m.examId) && !m.isAbsent)
    if (relevant.length === 0) return null
    return relevant.reduce((sum, m) => sum + m.marksObtained, 0) / relevant.length
  }, [studentMarks, exams])

  const documentsVerified = student?.documents.filter((d) => d.verified).length ?? 0

  if (!student) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="Student not found"
        description="This student record may have been removed."
        action={
          <Button render={<Link href="/students" />} nativeButton={false}>
            Back to Students
          </Button>
        }
      />
    )
  }

  const feeColumns: ColumnDef<FeeTransaction>[] = [
    {
      accessorKey: "receiptNo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Receipt No." />,
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => row.original.items.map((i) => i.label).join(", "),
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
    },
    {
      accessorKey: "mode",
      header: "Mode",
      cell: ({ getValue }) => <span className="capitalize">{getValue<string>()?.replace("_", " ") ?? "—"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
  ]

  const reportCards = exams
    .filter((e) => e.status === "published" || e.status === "completed")
    .map((exam) => {
      const examMarksForStudent = marks.filter((m) => m.examId === exam.id && m.studentId === studentId)
      const total = examMarksForStudent.reduce((sum, m) => sum + m.marksObtained, 0)
      const avg = examMarksForStudent.length ? total / examMarksForStudent.length : 0
      return { exam, avg, grade: gradeFor(avg), count: examMarksForStudent.length }
    })
    .filter((r) => r.count > 0)

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden py-0">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary" />
        <CardContent className="flex flex-col gap-4 pt-0 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
            <Avatar className="-mt-10 size-20 ring-4 ring-background">
              <AvatarFallback className="text-lg">
                {initials(`${student.firstName} ${student.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  {student.firstName} {student.lastName}
                </h1>
                <StatusBadge label={student.status} tone={toneForStatus(student.status)} className="capitalize" />
              </div>
              <p className="text-sm text-muted-foreground">
                {section ? `${section.className} · Section ${section.section}` : "Unassigned"} · Admission No.{" "}
                {student.admissionNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilIcon data-icon="inline-start" />
              Edit
            </Button>
            <Button
              render={<Link href={`/attendance?studentId=${student.id}`} />}
              nativeButton={false}
              variant="outline"
            >
              <CalendarCheckIcon data-icon="inline-start" />
              Take Attendance
            </Button>
            <Button
              render={<Link href={`/fees/collect?studentId=${student.id}`} />}
              nativeButton={false}
            >
              <WalletIcon data-icon="inline-start" />
              Collect Fee
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.success("ID card sent to printer")}>
                  <PrinterIcon />
                  Print ID Card
                </DropdownMenuItem>
                {student.status === "active" ? (
                  <DropdownMenuItem
                    onClick={() => {
                      update(student.id, { status: "inactive" })
                      toast.success("Student deactivated")
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
            { label: "Fee Balance", value: formatCurrency(feeBalance) },
            { label: "Overall Grade", value: latestExamAvg ? gradeFor(latestExamAvg) : "—" },
            { label: "Documents", value: `${documentsVerified}/${student.documents.length}` },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 p-4 text-center">
              <span className="text-lg font-semibold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parent">Parent & Guardian</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fee History</TabsTrigger>
          <TabsTrigger value="reports">Report Cards</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Date of Birth" value={formatDate(student.dob)} />
                <DetailRow label="Gender" value={student.gender} className="capitalize" />
                <DetailRow label="Blood Group" value={student.bloodGroup} />
                <DetailRow label="House" value={student.house ?? "—"} />
                <DetailRow label="Admission Date" value={formatDate(student.admissionDate)} />
                <DetailRow label="Previous School" value={student.previousSchool ?? "—"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Phone" value={student.phone} />
                <DetailRow label="Email" value={student.email || "—"} />
                <DetailRow
                  label="Address"
                  value={`${student.address.line1}, ${student.address.city}, ${student.address.state} ${student.address.pincode}`}
                  className="col-span-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parent" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Father</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <DetailRow label="Name" value={student.father.name} />
                <DetailRow label="Phone" value={student.father.phone} />
                <DetailRow label="Occupation" value={student.father.occupation ?? "—"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mother</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <DetailRow label="Name" value={student.mother.name} />
                <DetailRow label="Phone" value={student.mother.phone} />
                <DetailRow label="Occupation" value={student.mother.occupation ?? "—"} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medical" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow label="Blood Group" value={student.bloodGroup} />
              <DetailRow label="Vaccination" value={student.medical.vaccinationStatus} className="capitalize" />
              <DetailRow label="Height" value={`${student.medical.heightCm} cm`} />
              <DetailRow label="Weight" value={`${student.medical.weightKg} kg`} />
              <DetailRow label="Doctor" value={student.medical.doctorName} />
              <DetailRow label="Doctor Phone" value={student.medical.doctorPhone} />
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Allergies</span>
                <div className="flex flex-wrap gap-1">
                  {student.medical.allergies.length ? (
                    student.medical.allergies.map((a) => (
                      <Badge key={a} variant="outline">
                        {a}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">None reported</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {studentAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {[...studentAttendance]
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

        <TabsContent value="fees" className="mt-4">
          <DataTable columns={feeColumns} data={studentFees} emptyTitle="No fee transactions" />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          {reportCards.length === 0 ? (
            <EmptyState icon={FileTextIcon} title="No report cards yet" />
          ) : (
            <div className="flex flex-col gap-2">
              {reportCards.map(({ exam, avg, grade }) => (
                <Card key={exam.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">{exam.term} · {exam.academicYear}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">{avg.toFixed(1)}%</span>
                      <Badge>{grade}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/examinations/${exam.id}/report-cards`} />}
                        nativeButton={false}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
              {student.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {student.documents.map((doc) => (
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

      <StudentFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student}
        onSubmit={(updated) => update(student.id, updated)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student record?"
        description={`This will permanently remove ${student.firstName} ${student.lastName}'s record. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          remove(student.id)
          logActivity({
            action: "delete",
            module: "Students",
            entityType: "Student",
            entityId: student.id,
            description: `Deleted student ${student.firstName} ${student.lastName}`,
          })
          toast.success("Student deleted")
          router.push("/students")
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
