"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, UsersIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { EmptyState } from "@/components/shared/empty-state"
import { useLogActivity } from "@/lib/data/audit"
import { useAttendance, useClassSections, useStudents, useTeachers } from "@/lib/data/store/entities"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { initials } from "@/lib/format"
import type { AttendanceRecord, AttendanceStatus } from "@/lib/data/types"
import { AttendanceStatusToggle } from "./status-toggle"
import { formatLogDate, type AttendanceScope } from "./attendance-utils"

interface DailyViewProps {
  scope: AttendanceScope
  classSectionId: string
  date: string
  onDateChange: (date: string) => void
  initialSearch?: string
}

interface RosterEntry {
  id: string
  name: string
  subtitle: string
}

export function DailyView({ scope, classSectionId, date, onDateChange, initialSearch }: DailyViewProps) {
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const { items: classSections } = useClassSections()
  const { items: attendance, add, update } = useAttendance()
  const { user } = useCurrentUser()
  const logActivity = useLogActivity()

  const [search, setSearch] = useState(initialSearch ?? "")
  const [draft, setDraft] = useState<Map<string, AttendanceStatus>>(new Map())

  const section = classSections.find((cs) => cs.id === classSectionId)
  const personType = scope === "students" ? "student" : "staff"

  const roster: RosterEntry[] = useMemo(() => {
    if (scope === "students") {
      return students
        .filter((s) => s.classSectionId === classSectionId && s.status === "active")
        .sort((a, b) => a.rollNo - b.rollNo)
        .map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, subtitle: `Roll No. ${s.rollNo}` }))
    }
    return teachers
      .filter((t) => t.status === "active")
      .map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}`, subtitle: t.designation }))
  }, [scope, students, teachers, classSectionId])

  // Rebuild the local draft from persisted records whenever the date/scope/class changes —
  // intentionally NOT reactive to `attendance` itself so mid-edit drafts survive a Save.
  useEffect(() => {
    const next = new Map<string, AttendanceStatus>()
    roster.forEach((person) => {
      const existing = attendance.find(
        (a) => a.personId === person.id && a.date === date && a.personType === personType
      )
      if (existing) next.set(person.id, existing.status)
    })
    setDraft(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, scope, classSectionId])

  if (scope === "students" && !classSectionId) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Select a class & section"
        description="Choose a class and section above to take attendance."
      />
    )
  }

  const filteredRoster = roster.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  const markedCount = roster.filter((p) => draft.has(p.id)).length

  function setStatus(personId: string, status: AttendanceStatus) {
    setDraft((prev) => {
      const next = new Map(prev)
      next.set(personId, status)
      return next
    })
  }

  function markAllPresent() {
    setDraft((prev) => {
      const next = new Map(prev)
      roster.forEach((p) => next.set(p.id, "present"))
      return next
    })
  }

  function handleSave() {
    let savedCount = 0
    roster.forEach((person) => {
      const status = draft.get(person.id)
      if (!status) return
      savedCount += 1
      const existing = attendance.find(
        (a) => a.personId === person.id && a.date === date && a.personType === personType
      )
      if (existing) {
        update(existing.id, { status, markedBy: user.id, markedAt: new Date().toISOString() })
      } else {
        const record: AttendanceRecord = {
          id: `att_live_${personType}_${person.id}_${date}`,
          personId: person.id,
          personType,
          classSectionId: scope === "students" ? classSectionId : undefined,
          date,
          status,
          markedBy: user.id,
          markedAt: new Date().toISOString(),
        }
        add(record)
      }
    })

    const label = scope === "students" ? `${section?.className ?? ""} - ${section?.section ?? ""}` : "Staff"
    logActivity({
      action: "update",
      module: "Attendance",
      entityType: "AttendanceRecord",
      entityId: classSectionId || undefined,
      description: `Marked attendance for ${label} — ${formatLogDate(date)}`,
    })
    toast.success("Attendance saved", {
      description: `${savedCount} of ${roster.length} marked for ${formatLogDate(date)}.`,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 max-w-xs">
            <InputGroupInput
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
          </InputGroup>
          <Input
            type="date"
            className="w-40"
            value={date}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={markAllPresent}>
          Mark All Present
        </Button>
      </div>

      {filteredRoster.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No one found" description="Try a different search term." />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredRoster.map((person) => (
            <Item key={person.id} variant="outline">
              <ItemMedia>
                <Avatar>
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{person.name}</ItemTitle>
                <ItemDescription>{person.subtitle}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <AttendanceStatusToggle
                  value={draft.get(person.id)}
                  onChange={(status) => setStatus(person.id, status)}
                />
              </ItemActions>
            </Item>
          ))}
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex items-center justify-between gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <span className="text-sm text-muted-foreground">
          {markedCount}/{roster.length} marked
        </span>
        <Button onClick={handleSave} disabled={roster.length === 0}>
          Save Attendance
        </Button>
      </div>
    </div>
  )
}
