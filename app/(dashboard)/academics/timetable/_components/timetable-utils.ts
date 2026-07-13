import type { TimetableSlot } from "@/lib/data/types"

export const DAYS: TimetableSlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Mirrors the period times used by the seed generator (lib/data/seed/generate.ts). */
export const PERIOD_TIMES: [string, string][] = [
  ["08:00", "08:45"],
  ["08:45", "09:30"],
  ["09:30", "10:15"],
  ["10:15", "11:00"],
  ["11:15", "12:00"],
  ["12:00", "12:45"],
  ["13:30", "14:15"],
  ["14:15", "15:00"],
]

export const PERIODS = PERIOD_TIMES.map((_, i) => i + 1)

const CHART_COLOR_COUNT = 5

/** Small deterministic string hash so each subject gets a stable color across renders. */
function hashColorIndex(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash % CHART_COLOR_COUNT
}

export function subjectColorVar(subjectId: string): string {
  return `var(--chart-${hashColorIndex(subjectId) + 1})`
}
