"use client"

import { useMemo, useState } from "react"
import { CalendarDaysIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useClassSections, useSubjects, useTeachers, useTimetable } from "@/lib/data/store/entities"
import type { TimetableSlot } from "@/lib/data/types"
import { TimetableGrid } from "./timetable-grid"
import { TimetableSlotDialog } from "./timetable-slot-dialog"

type ViewMode = "class" | "teacher"

interface ActiveCell {
  day: TimetableSlot["day"]
  period: number
  existing: TimetableSlot | null
}

export function TimetableView() {
  const { items: classSections } = useClassSections()
  const { items: teachers } = useTeachers()
  const { items: subjects } = useSubjects()
  const { items: slots } = useTimetable()

  const [mode, setMode] = useState<ViewMode>("class")
  const [classSectionId, setClassSectionId] = useState(classSections[0]?.id ?? "")
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "")
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null)

  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const teachersById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])
  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])

  const selectedSection = classSectionsById.get(classSectionId)
  const sectionLabel = selectedSection ? `${selectedSection.className} — ${selectedSection.section}` : ""

  const visibleSlots = useMemo(() => {
    if (mode === "class") return slots.filter((s) => s.classSectionId === classSectionId)
    return slots.filter((s) => s.teacherId === teacherId)
  }, [slots, mode, classSectionId, teacherId])

  function handleCellClick(day: TimetableSlot["day"], period: number, existing: TimetableSlot | null) {
    if (mode !== "class") return
    setActiveCell({ day, period, existing })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Timetable"
        description="Weekly class schedule by day and period. Click a cell to assign or clear a slot."
      />

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          variant="outline"
          value={[mode]}
          onValueChange={(values) => {
            const next = values[0] as ViewMode | undefined
            if (next) setMode(next)
          }}
        >
          <ToggleGroupItem value="class">Class View</ToggleGroupItem>
          <ToggleGroupItem value="teacher">Teacher View</ToggleGroupItem>
        </ToggleGroup>

        {mode === "class" ? (
          <Select value={classSectionId} onValueChange={(v) => setClassSectionId(v ?? "")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classSections.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.className} — {cs.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={teacherId} onValueChange={(v) => setTeacherId(v ?? "")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {mode === "class" && !selectedSection ? (
        <EmptyState
          icon={CalendarDaysIcon}
          title="No class selected"
          description="Choose a class and section above to view or edit its timetable."
        />
      ) : (
        <TimetableGrid
          slots={visibleSlots}
          subjectsById={subjectsById}
          teachersById={teachersById}
          classSectionsById={classSectionsById}
          mode={mode}
          onCellClick={handleCellClick}
        />
      )}

      {selectedSection && activeCell ? (
        <TimetableSlotDialog
          open={!!activeCell}
          onOpenChange={(open) => !open && setActiveCell(null)}
          classSectionId={selectedSection.id}
          sectionLabel={sectionLabel}
          day={activeCell.day}
          period={activeCell.period}
          existing={activeCell.existing}
          defaultRoomNo={selectedSection.roomNo}
        />
      ) : null}
    </div>
  )
}
