"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { UsersIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { HorizontalScroller } from "@/components/shared/horizontal-scroller"
import { toneBgClass, toneForStatus } from "@/components/shared/status-badge"
import { useAttendance, useClassSections, useStudents, useTeachers } from "@/lib/data/store/entities"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import type { AttendanceRecord, AttendanceStatus } from "@/lib/data/types"
import { AttendanceStatusToggle } from "./status-toggle"
import { attendancePercent, monthDates, monthLabel, type AttendanceScope } from "./attendance-utils"

interface MonthlyViewProps {
  scope: AttendanceScope
  classSectionId: string
  month: string
  onMonthChange: (month: string) => void
}

interface RosterEntry {
  id: string
  name: string
}

export function MonthlyView({ scope, classSectionId, month, onMonthChange }: MonthlyViewProps) {
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const { items: attendance, add, update } = useAttendance()
  const { user } = useCurrentUser()

  const personType = scope === "students" ? "student" : "staff"

  const roster: RosterEntry[] = useMemo(() => {
    if (scope === "students") {
      return students
        .filter((s) => s.classSectionId === classSectionId && s.status === "active")
        .sort((a, b) => a.rollNo - b.rollNo)
        .map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }))
    }
    return teachers.filter((t) => t.status === "active").map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))
  }, [scope, students, teachers, classSectionId])

  const dates = useMemo(() => monthDates(month), [month])

  const recordsByPerson = useMemo(() => {
    const map = new Map<string, Map<string, AttendanceRecord>>()
    roster.forEach((person) => {
      const byDate = new Map<string, AttendanceRecord>()
      attendance
        .filter((a) => a.personId === person.id && a.personType === personType && dates.includes(a.date))
        .forEach((a) => byDate.set(a.date, a))
      map.set(person.id, byDate)
    })
    return map
  }, [roster, attendance, personType, dates])

  function setStatus(personId: string, date: string, status: AttendanceStatus) {
    const existing = recordsByPerson.get(personId)?.get(date)
    if (existing) {
      update(existing.id, { status, markedBy: user.id, markedAt: new Date().toISOString() })
    } else {
      const record: AttendanceRecord = {
        id: `att_live_${personType}_${personId}_${date}`,
        personId,
        personType,
        classSectionId: scope === "students" ? classSectionId : undefined,
        date,
        status,
        markedBy: user.id,
        markedAt: new Date().toISOString(),
      }
      add(record)
    }
    toast.success("Attendance updated", { description: `${status.replace("_", " ")} on ${date}` })
  }

  if (scope === "students" && !classSectionId) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Select a class & section"
        description="Choose a class and section above to view monthly attendance."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          type="month"
          className="w-40"
          value={month}
          onChange={(e) => e.target.value && onMonthChange(e.target.value)}
        />
        <span className="text-sm text-muted-foreground">{monthLabel(month)}</span>
      </div>

      {roster.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No one found" description="No active records for this selection." />
      ) : (
        <HorizontalScroller className="rounded-lg border" contentClassName="rounded-lg">
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background">Name</TableHead>
                {dates.map((d) => (
                  <TableHead key={d} className="w-8 text-center">
                    {Number(d.slice(-2))}
                  </TableHead>
                ))}
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((person) => {
                const byDate = recordsByPerson.get(person.id) ?? new Map<string, AttendanceRecord>()
                const personRecords = [...byDate.values()]
                const presentCount = personRecords.filter((r) => r.status === "present" || r.status === "late").length
                const absentCount = personRecords.filter((r) => r.status === "absent").length
                const pct = attendancePercent(personRecords)
                return (
                  <TableRow key={person.id}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium whitespace-nowrap">
                      {person.name}
                    </TableCell>
                    {dates.map((d) => {
                      const record = byDate.get(d)
                      return (
                        <TableCell key={d} className="p-1 text-center">
                          <Popover>
                            <PopoverTrigger
                              render={
                                <button
                                  type="button"
                                  title={record ? `${d} — ${record.status}` : d}
                                  className={`mx-auto flex size-6 items-center justify-center rounded-sm text-[10px] font-medium ${record ? toneBgClass(toneForStatus(record.status)) : "bg-muted/40 text-muted-foreground hover:bg-muted"}`}
                                />
                              }
                            >
                              {record ? record.status.slice(0, 1).toUpperCase() : ""}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto">
                              <div className="flex flex-col gap-2">
                                <p className="text-xs text-muted-foreground">{d}</p>
                                <AttendanceStatusToggle
                                  value={record?.status}
                                  onChange={(status) => setStatus(person.id, d, status)}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center">{presentCount}</TableCell>
                    <TableCell className="text-center">{absentCount}</TableCell>
                    <TableCell className="text-center">{pct}%</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </table>
        </HorizontalScroller>
      )}
    </div>
  )
}
