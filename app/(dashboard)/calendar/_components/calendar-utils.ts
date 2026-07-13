import type { StatusTone } from "@/components/shared/status-badge"
import type { CalendarEvent, CalendarEventType } from "@/lib/data/types"

export interface DisplayEvent {
  id: string
  title: string
  type: CalendarEventType
  date: string
  endDate?: string
  allDay: boolean
  description?: string
  audience: string
  isPseudo: boolean
  source?: CalendarEvent
}

export const CALENDAR_EVENT_META: Record<CalendarEventType, { label: string; tone: StatusTone }> = {
  holiday: { label: "Holiday", tone: "neutral" },
  exam: { label: "Exam", tone: "warning" },
  event: { label: "Event", tone: "info" },
  meeting: { label: "Meeting", tone: "info" },
  fee_due: { label: "Fee Due", tone: "warning" },
  birthday: { label: "Birthday", tone: "success" },
  academic: { label: "Academic", tone: "info" },
}

export const CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  "holiday",
  "exam",
  "event",
  "meeting",
  "fee_due",
  "birthday",
  "academic",
]

export const TONE_DOT_CLASS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/** Local (non-UTC) YYYY-MM-DD key for a given Date — matches the seed data's date-string format. */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function isSameMonth(d: Date, ref: Date): boolean {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function isSameDay(d: Date, ref: Date): boolean {
  return toDateKey(d) === toDateKey(ref)
}

/** Sunday-first 6-week (42 day) grid covering the given month, with leading/trailing days from adjacent months. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startWeekday)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

/** Sunday-first week containing the given date. */
export function buildWeekGrid(date: Date): Date[] {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
