"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { toneBgClass } from "@/components/shared/status-badge"
import { useCalendarEvents, useFeeInstallments, useStudents, useTeachers } from "@/lib/data/store/entities"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/data/types"
import {
  buildMonthGrid,
  buildWeekGrid,
  CALENDAR_EVENT_META,
  CALENDAR_EVENT_TYPES,
  isSameDay,
  isSameMonth,
  MONTH_LABELS,
  TONE_DOT_CLASS,
  toDateKey,
  WEEKDAY_LABELS,
} from "./calendar-utils"
import type { DisplayEvent } from "./calendar-utils"
import { EventDetailDialog } from "./event-detail-dialog"
import { EventFormDialog } from "./event-form-dialog"

type ViewMode = "month" | "week" | "day"

export function CalendarView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category")

  const { items: calendarEvents } = useCalendarEvents()
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const { items: feeInstallments } = useFeeInstallments()

  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState<Date>(new Date(SEED_TODAY))
  const [openDayKey, setOpenDayKey] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined)
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined)
  const [detailEvent, setDetailEvent] = useState<DisplayEvent | null>(null)

  // --- Derived pseudo-events (birthdays, fee-due) — computed at render time, never stored ---
  const birthdaysByMonthDay = useMemo(() => {
    const map = new Map<string, DisplayEvent[]>()
    const addPerson = (id: string, name: string, dob: string, audience: string) => {
      const mmdd = dob.slice(5)
      const list = map.get(mmdd) ?? []
      list.push({
        id: `pseudo_bday_${id}`,
        title: `${name}'s Birthday`,
        type: "birthday",
        date: mmdd,
        allDay: true,
        audience,
        description: `${name}'s birthday`,
        isPseudo: true,
      })
      map.set(mmdd, list)
    }
    students.forEach((s) => addPerson(`stu_${s.id}`, `${s.firstName} ${s.lastName}`, s.dob, "Students"))
    teachers.forEach((t) => addPerson(`tea_${t.id}`, `${t.firstName} ${t.lastName}`, t.dob, "Staff"))
    return map
  }, [students, teachers])

  const feeDueByDate = useMemo(() => {
    const map = new Map<string, DisplayEvent[]>()
    feeInstallments.forEach((fi) => {
      const list = map.get(fi.dueDate) ?? []
      list.push({
        id: `pseudo_fee_${fi.id}`,
        title: `${fi.label} Fee Due`,
        type: "fee_due",
        date: fi.dueDate,
        allDay: true,
        audience: "Students",
        description: `${fi.label} installment due`,
        isPseudo: true,
      })
      map.set(fi.dueDate, list)
    })
    return map
  }, [feeInstallments])

  function getEventsForDay(day: Date, includePseudo: boolean): DisplayEvent[] {
    const key = toDateKey(day)
    const events: DisplayEvent[] = calendarEvents
      .filter((e) => key >= e.date && key <= (e.endDate ?? e.date))
      .map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date,
        endDate: e.endDate,
        allDay: e.allDay,
        description: e.description,
        audience: e.audience,
        isPseudo: false,
        source: e,
      }))
    if (includePseudo) {
      const mmdd = key.slice(5)
      const bdays = (birthdaysByMonthDay.get(mmdd) ?? []).map((b) => ({ ...b, date: key }))
      const fees = feeDueByDate.get(key) ?? []
      events.push(...bdays, ...fees)
    }
    return categoryFilter === "academic"
      ? events.filter((e) => e.type === "academic" || e.type === "exam")
      : events
  }

  function goPrev() {
    setCurrentDate((d) => {
      const next = new Date(d)
      if (viewMode === "month") next.setMonth(next.getMonth() - 1)
      else if (viewMode === "week") next.setDate(next.getDate() - 7)
      else next.setDate(next.getDate() - 1)
      return next
    })
  }

  function goNext() {
    setCurrentDate((d) => {
      const next = new Date(d)
      if (viewMode === "month") next.setMonth(next.getMonth() + 1)
      else if (viewMode === "week") next.setDate(next.getDate() + 7)
      else next.setDate(next.getDate() + 1)
      return next
    })
  }

  function goToday() {
    setCurrentDate(new Date(SEED_TODAY))
  }

  function openAddDialog(date?: string) {
    setEditingEvent(undefined)
    setPrefillDate(date ?? toDateKey(currentDate))
    setFormOpen(true)
  }

  const weekDays = useMemo(() => buildWeekGrid(currentDate), [currentDate])
  const monthGrid = useMemo(
    () => buildMonthGrid(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  )

  const rangeLabel =
    viewMode === "month"
      ? `${MONTH_LABELS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : viewMode === "week"
        ? `${formatDate(toDateKey(weekDays[0]))} – ${formatDate(toDateKey(weekDays[6]))}`
        : formatDate(toDateKey(currentDate))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="School calendar."
        actions={
          <Button onClick={() => openAddDialog()}>
            <PlusIcon data-icon="inline-start" />
            New Event
          </Button>
        }
      />

      {categoryFilter ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <span>
            Showing <span className="font-medium capitalize">{categoryFilter}</span> events only.
          </span>
          <Button variant="ghost" size="sm" onClick={() => router.replace("/calendar")}>
            <XIcon data-icon="inline-start" />
            Clear filter
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goPrev} aria-label="Previous">
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goNext} aria-label="Next">
            <ChevronRightIcon />
          </Button>
          <h2 className="ml-2 text-base font-semibold">{rangeLabel}</h2>
        </div>
        <ToggleGroup
          variant="outline"
          value={[viewMode]}
          onValueChange={(v) => {
            if (v[0]) setViewMode(v[0] as ViewMode)
          }}
        >
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === "month" ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((day) => {
              const key = toDateKey(day)
              const inCurrentMonth = isSameMonth(day, currentDate)
              const events = getEventsForDay(day, inCurrentMonth)
              const today = isSameDay(day, SEED_TODAY)
              return (
                <div
                  key={key}
                  className={cn(
                    "relative flex min-h-[104px] flex-col gap-1 border-r border-b p-1.5 last:border-r-0",
                    !inCurrentMonth && "bg-muted/20"
                  )}
                >
                  <Popover open={openDayKey === key} onOpenChange={(open) => setOpenDayKey(open ? key : null)}>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="absolute inset-0 z-0"
                          aria-label={`Events on ${formatDate(key)}`}
                        />
                      }
                    />
                    <PopoverContent align="start" className="w-72">
                      <PopoverHeader>
                        <PopoverTitle>{formatDate(key)}</PopoverTitle>
                      </PopoverHeader>
                      <div className="flex max-h-64 flex-col gap-1 scrollbar-thin overflow-y-auto">
                        {events.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No events.</p>
                        ) : (
                          events.map((ev) => {
                            const meta = CALENDAR_EVENT_META[ev.type]
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() => {
                                  setDetailEvent(ev)
                                  setOpenDayKey(null)
                                }}
                                className="flex items-center gap-2 rounded-md p-1.5 text-left text-sm hover:bg-muted"
                              >
                                <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT_CLASS[meta.tone])} />
                                <span className="flex-1 truncate">{ev.title}</span>
                              </button>
                            )
                          })
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          openAddDialog(key)
                          setOpenDayKey(null)
                        }}
                      >
                        <PlusIcon data-icon="inline-start" />
                        Add
                      </Button>
                    </PopoverContent>
                  </Popover>

                  <div className="pointer-events-none relative z-[1] flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                        today && "bg-primary text-primary-foreground",
                        !inCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="pointer-events-none relative z-[1] flex flex-col gap-0.5 overflow-hidden">
                    {events.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailEvent(ev)
                        }}
                        title={ev.title}
                        className={cn(
                          "pointer-events-auto truncate rounded px-1 py-0.5 text-left text-[10px] font-medium",
                          toneBgClass(CALENDAR_EVENT_META[ev.type].tone)
                        )}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {events.length > 3 ? (
                      <span className="pointer-events-none px-1 text-[10px] text-muted-foreground">
                        +{events.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {viewMode === "week" ? (
        <div className="grid grid-cols-7 divide-x overflow-hidden rounded-lg border">
          {weekDays.map((day) => {
            const key = toDateKey(day)
            const events = getEventsForDay(day, true)
            const today = isSameDay(day, SEED_TODAY)
            return (
              <div key={key} className="flex min-h-[320px] flex-col gap-2 p-2">
                <div className="flex flex-col items-center gap-0.5 border-b pb-2">
                  <span className="text-xs text-muted-foreground">{WEEKDAY_LABELS[day.getDay()]}</span>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm font-medium",
                      today && "bg-primary text-primary-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {events.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground">No events</p>
                  ) : (
                    events.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setDetailEvent(ev)}
                        className={cn(
                          "truncate rounded px-1.5 py-1 text-left text-xs font-medium",
                          toneBgClass(CALENDAR_EVENT_META[ev.type].tone)
                        )}
                      >
                        {ev.title}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {viewMode === "day" ? (
        <Card>
          <CardHeader>
            <CardTitle>{formatDate(toDateKey(currentDate))}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const events = getEventsForDay(currentDate, true)
              if (events.length === 0) {
                return <EmptyState icon={CalendarIcon} title="No events" description="Nothing scheduled for this day." />
              }
              return (
                <ItemGroup>
                  {events.map((ev) => {
                    const meta = CALENDAR_EVENT_META[ev.type]
                    return (
                      <Item
                        key={ev.id}
                        render={<button type="button" onClick={() => setDetailEvent(ev)} />}
                      >
                        <ItemMedia variant="icon">
                          <span className={cn("size-2.5 rounded-full", TONE_DOT_CLASS[meta.tone])} />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{ev.title}</ItemTitle>
                          <ItemDescription>{ev.description ?? meta.label}</ItemDescription>
                        </ItemContent>
                      </Item>
                    )
                  })}
                </ItemGroup>
              )
            })()}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {CALENDAR_EVENT_TYPES.map((type) => {
          const meta = CALENDAR_EVENT_META[type]
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", TONE_DOT_CLASS[meta.tone])} />
              {meta.label}
            </div>
          )
        })}
      </div>

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingEvent={editingEvent}
        prefillDate={prefillDate}
      />

      <EventDetailDialog
        event={detailEvent}
        onOpenChange={(open) => !open && setDetailEvent(null)}
        onEdit={() => {
          if (detailEvent?.source) {
            setEditingEvent(detailEvent.source)
            setPrefillDate(undefined)
            setFormOpen(true)
          }
          setDetailEvent(null)
        }}
      />
    </div>
  )
}
