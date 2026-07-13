import type { AttendanceStatus } from "@/lib/data/types"

export type AttendanceScope = "students" | "staff"
export type AttendanceViewMode = "daily" | "monthly" | "calendar"

export const STATUS_OPTIONS: { value: AttendanceStatus; label: string; full: string }[] = [
  { value: "present", label: "P", full: "Present" },
  { value: "absent", label: "A", full: "Absent" },
  { value: "late", label: "L", full: "Late" },
  { value: "leave", label: "Lv", full: "Leave" },
  { value: "half_day", label: "HD", full: "Half Day" },
]

/** Days in a "YYYY-MM" month string. */
export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m, 0).getDate()
}

/** Every "YYYY-MM-DD" date string in a "YYYY-MM" month — built via string padding (no Date/ISO
 * round-trip) so results are timezone-independent and match the plain date-string convention
 * used for AttendanceRecord.date across the app. */
export function monthDates(month: string): string[] {
  const [y, m] = month.split("-").map(Number)
  const count = daysInMonth(month)
  return Array.from(
    { length: count },
    (_, i) => `${y}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
  )
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

/** Present + late counted towards attendance %, matching the convention used on the dashboard
 * and student profile pages. */
export function attendancePercent(records: { status: AttendanceStatus }[]): number {
  if (records.length === 0) return 0
  const present = records.filter((r) => r.status === "present" || r.status === "late").length
  return Math.round((present / records.length) * 100)
}

/** e.g. "13 Jul 2026" — used in audit log descriptions and save toasts. */
export function formatLogDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}
