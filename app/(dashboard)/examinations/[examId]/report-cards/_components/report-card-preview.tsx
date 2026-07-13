"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DownloadIcon, PrinterIcon } from "lucide-react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { initials } from "@/lib/format"
import { useAcademicSession, useAttendance, useSchoolProfile } from "@/lib/data/store/entities"
import type { Exam } from "@/lib/data/types"
import type { StudentExamResult } from "../../_components/exam-results"

interface ReportCardPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exam: Exam
  result: StudentExamResult
}

export function ReportCardPreview({ open, onOpenChange, exam, result }: ReportCardPreviewProps) {
  const { value: school } = useSchoolProfile()
  const { value: academicSession } = useAcademicSession()
  const { items: attendance } = useAttendance()
  const [remarks, setRemarks] = useState("")

  const attendancePct = useMemo(() => {
    const term = academicSession.terms.find((t) => t.name === exam.term)
    const records = attendance.filter(
      (a) =>
        a.personId === result.student.id &&
        a.personType === "student" &&
        (!term || (a.date >= term.startDate && a.date <= term.endDate))
    )
    if (records.length === 0) return null
    const present = records.filter((a) => a.status === "present" || a.status === "late").length
    return Math.round((present / records.length) * 100)
  }, [attendance, academicSession, exam.term, result.student.id])

  const student = result.student

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] scrollbar-thin overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Card</DialogTitle>
          <DialogDescription>
            {exam.name} - {exam.term} - {exam.academicYear}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col items-center gap-1 border-b pb-4 text-center">
            <p className="font-heading text-lg font-semibold">{school.name}</p>
            <p className="text-xs text-muted-foreground">{school.address}</p>
            <p className="text-xs text-muted-foreground">
              {school.phone} - {school.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{initials(`${student.firstName} ${student.lastName}`)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.classSection.className} - {result.classSection.section} - Roll No. {student.rollNo} -
                Admission No. {student.admissionNo}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Marks Obtained</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.subjectResults.map((sr) => (
                  <TableRow key={sr.subjectId}>
                    <TableCell>{sr.subjectName}</TableCell>
                    <TableCell>{sr.maxMarks}</TableCell>
                    <TableCell>{sr.isAbsent ? "Absent" : sr.marksObtained}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sr.grade}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-4">
            <Stat label="Total" value={`${result.total}/${result.totalMax}`} />
            <Stat label="Percentage" value={`${result.percentage.toFixed(1)}%`} />
            <Stat label="Overall Grade" value={result.grade} />
            <Stat label="Rank" value={`#${result.rank}`} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-muted-foreground">Attendance ({exam.term})</span>
            <span className="font-medium">{attendancePct === null ? "-" : `${attendancePct}%`}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="teacherRemarks">
              Class Teacher Remarks
            </label>
            <Textarea
              id="teacherRemarks"
              placeholder="Add remarks for this student..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" />
            Print
          </Button>
          <Button
            onClick={() =>
              toast.success("Download started", { description: "Report card PDF is being generated." })
            }
          >
            <DownloadIcon data-icon="inline-start" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
