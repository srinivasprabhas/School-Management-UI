"use client"

import { useMemo } from "react"

import { HorizontalScroller } from "@/components/shared/horizontal-scroller"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ClassSection, Subject, Teacher, TimetableSlot } from "@/lib/data/types"
import { DAYS, PERIOD_TIMES, subjectColorVar } from "./timetable-utils"

interface TimetableGridProps {
  slots: TimetableSlot[]
  subjectsById: Map<string, Subject>
  teachersById: Map<string, Teacher>
  classSectionsById: Map<string, ClassSection>
  /** class = editable single-section grid; teacher = read-only combined schedule across classes. */
  mode: "class" | "teacher"
  onCellClick?: (day: TimetableSlot["day"], period: number, existing: TimetableSlot | null) => void
}

export function TimetableGrid({
  slots,
  subjectsById,
  teachersById,
  classSectionsById,
  mode,
  onCellClick,
}: TimetableGridProps) {
  const slotsByKey = useMemo(() => {
    const map = new Map<string, TimetableSlot[]>()
    slots.forEach((s) => {
      const key = `${s.day}_${s.period}`
      const list = map.get(key) ?? []
      list.push(s)
      map.set(key, list)
    })
    return map
  }, [slots])

  const editable = mode === "class"

  return (
    <HorizontalScroller className="rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="w-24 border-b p-2 text-left text-xs font-medium text-muted-foreground">Period</th>
            {DAYS.map((day) => (
              <th key={day} className="border-b p-2 text-left text-xs font-medium text-muted-foreground">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIOD_TIMES.map(([start, end], idx) => {
            const period = idx + 1
            return (
              <tr key={period} className="border-b last:border-b-0">
                <td className="w-24 border-r p-2 align-top">
                  <div className="text-xs font-medium">Period {period}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {start}–{end}
                  </div>
                </td>
                {DAYS.map((day) => {
                  const cellSlots = slotsByKey.get(`${day}_${period}`) ?? []
                  return (
                    <td key={day} className="min-w-36 border-r p-1 align-top last:border-r-0">
                      {cellSlots.length === 0 ? (
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => onCellClick?.(day, period, null)}
                          className={cn(
                            "flex h-14 w-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground",
                            editable && "cursor-pointer hover:bg-muted/60"
                          )}
                        >
                          {editable ? "+ Add" : ""}
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {cellSlots.map((slot) => {
                            const subject = subjectsById.get(slot.subjectId)
                            const teacher = teachersById.get(slot.teacherId)
                            const cs = classSectionsById.get(slot.classSectionId)
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={!editable}
                                onClick={() => onCellClick?.(day, period, slot)}
                                style={{
                                  backgroundColor: `color-mix(in oklch, ${subjectColorVar(slot.subjectId)} 22%, transparent)`,
                                  borderColor: `color-mix(in oklch, ${subjectColorVar(slot.subjectId)} 45%, transparent)`,
                                }}
                                className={cn(
                                  "flex w-full flex-col rounded-md border p-1.5 text-left text-xs",
                                  editable && "cursor-pointer hover:opacity-80"
                                )}
                              >
                                <span className="font-medium">{subject?.name ?? "Unknown Subject"}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {mode === "teacher" && cs ? `${cs.className} ${cs.section} · ` : ""}
                                  {teacher ? initials(`${teacher.firstName} ${teacher.lastName}`) : "—"} · {slot.roomNo}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </HorizontalScroller>
  )
}
