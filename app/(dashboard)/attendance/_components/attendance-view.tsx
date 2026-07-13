"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FileBarChart2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClassSections, useStudents } from "@/lib/data/store/entities"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { toISODate } from "@/lib/data/seed/random"
import { DailyView } from "./daily-view"
import { MonthlyView } from "./monthly-view"
import { CalendarView } from "./calendar-view"
import type { AttendanceScope, AttendanceViewMode } from "./attendance-utils"

export function AttendanceView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: classSections } = useClassSections()
  const { items: students } = useStudents()

  const scope: AttendanceScope = searchParams.get("scope") === "staff" ? "staff" : "students"
  const view: AttendanceViewMode = (() => {
    const v = searchParams.get("view")
    return v === "monthly" || v === "calendar" ? v : "daily"
  })()
  const classSectionIdParam = searchParams.get("classSectionId") ?? ""
  const studentIdParam = searchParams.get("studentId") ?? ""
  const date = searchParams.get("date") || toISODate(SEED_TODAY)
  const month = searchParams.get("month") || toISODate(SEED_TODAY).slice(0, 7)

  const linkedStudent = useMemo(
    () => (studentIdParam ? students.find((s) => s.id === studentIdParam) : undefined),
    [students, studentIdParam]
  )
  const classSectionId = classSectionIdParam || linkedStudent?.classSectionId || ""

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) params.delete(key)
      else params.set(key, value)
    })
    const query = params.toString()
    router.replace(query ? `/attendance?${query}` : "/attendance")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Take and review daily, monthly, and historical attendance."
        actions={
          <Button variant="outline" onClick={() => router.push("/attendance/reports")}>
            <FileBarChart2Icon data-icon="inline-start" />
            Reports
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          variant="outline"
          value={[scope]}
          onValueChange={(next) => {
            if (next.length === 0) return
            const nextScope = next[0] as AttendanceScope
            updateParams({
              scope: nextScope === "staff" ? "staff" : null,
              classSectionId: nextScope === "staff" ? null : classSectionIdParam,
              studentId: null,
            })
          }}
        >
          <ToggleGroupItem value="students">Students</ToggleGroupItem>
          <ToggleGroupItem value="staff">Staff</ToggleGroupItem>
        </ToggleGroup>

        {scope === "students" ? (
          <Select value={classSectionId} onValueChange={(v) => updateParams({ classSectionId: v })}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select class & section" />
            </SelectTrigger>
            <SelectContent>
              {classSections.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.className} — {cs.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <ToggleGroup
          variant="outline"
          className="ml-auto"
          value={[view]}
          onValueChange={(next) => {
            if (next.length === 0) return
            updateParams({ view: next[0] === "daily" ? null : next[0] })
          }}
        >
          <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "daily" ? (
        <DailyView
          scope={scope}
          classSectionId={classSectionId}
          date={date}
          onDateChange={(d) => updateParams({ date: d })}
          initialSearch={linkedStudent ? `${linkedStudent.firstName} ${linkedStudent.lastName}` : ""}
        />
      ) : view === "monthly" ? (
        <MonthlyView
          scope={scope}
          classSectionId={classSectionId}
          month={month}
          onMonthChange={(m) => updateParams({ month: m })}
        />
      ) : (
        <CalendarView scope={scope} classSectionId={classSectionId} initialPersonId={studentIdParam} />
      )}
    </div>
  )
}
