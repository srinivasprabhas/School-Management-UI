"use client"

import { useMemo, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"
import { toneBgClass, toneForStatus } from "@/components/shared/status-badge"
import { useAttendance, useStudents, useTeachers } from "@/lib/data/store/entities"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { STATUS_OPTIONS, type AttendanceScope } from "./attendance-utils"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarViewProps {
  scope: AttendanceScope
  classSectionId: string
  initialPersonId?: string
}

export function CalendarView({ scope, classSectionId, initialPersonId }: CalendarViewProps) {
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const { items: attendance } = useAttendance()

  const roster = useMemo(() => {
    if (scope === "students") {
      const pool = classSectionId ? students.filter((s) => s.classSectionId === classSectionId) : students
      return pool
        .filter((s) => s.status === "active")
        .sort((a, b) => a.rollNo - b.rollNo)
        .map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }))
    }
    return teachers.filter((t) => t.status === "active").map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))
  }, [scope, students, teachers, classSectionId])

  const [personId, setPersonId] = useState(initialPersonId || roster[0]?.id || "")
  const [month, setMonth] = useState(() => new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth(), 1))

  const effectivePersonId = roster.some((p) => p.id === personId) ? personId : (roster[0]?.id ?? "")
  const personType = scope === "students" ? "student" : "staff"

  const recordsByDate = useMemo(() => {
    const map = new Map<string, string>()
    attendance
      .filter((a) => a.personId === effectivePersonId && a.personType === personType)
      .forEach((a) => map.set(a.date, a.status))
    return map
  }, [attendance, effectivePersonId, personType])

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const monthStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}`
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  if (roster.length === 0) {
    return <EmptyState icon={UserIcon} title="No one found" description="No active records for this selection." />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={effectivePersonId} onValueChange={(v) => v && setPersonId(v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a person" />
          </SelectTrigger>
          <SelectContent>
            {roster.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}>
            <ChevronLeftIcon />
          </Button>
          <span className="w-36 text-center text-sm font-medium">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`
          const status = recordsByDate.get(dateStr)
          return (
            <div
              key={dateStr}
              title={status ? `${dateStr} — ${status}` : dateStr}
              className={`flex aspect-square items-center justify-center rounded-md text-sm ${status ? toneBgClass(toneForStatus(status)) : "bg-muted/40 text-muted-foreground"}`}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t pt-4">
        {STATUS_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`size-3 rounded-sm ${toneBgClass(toneForStatus(opt.value))}`} />
            {opt.full}
          </div>
        ))}
      </div>
    </div>
  )
}
