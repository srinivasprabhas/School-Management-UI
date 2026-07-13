import type { ClassSection } from "@/lib/data/types"

/** Shared filter state driven by the filter bar at the top of every report tab. */
export interface ReportFilters {
  classId: string // "all" | SchoolClass id
  sectionId: string // "all" | ClassSection id (must belong to classId)
  dateFrom: string // "" | ISO date (yyyy-mm-dd)
  dateTo: string // "" | ISO date (yyyy-mm-dd)
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  classId: "all",
  sectionId: "all",
  dateFrom: "",
  dateTo: "",
}

/** True if the given class section satisfies the class/section portion of the filters. */
export function classSectionMatches(cs: ClassSection, filters: ReportFilters): boolean {
  if (filters.classId !== "all" && cs.classId !== filters.classId) return false
  if (filters.sectionId !== "all" && cs.id !== filters.sectionId) return false
  return true
}

/** True if the given ISO date string falls within the filters' date range (inclusive). Missing bounds are open-ended. */
export function inDateRange(dateStr: string | undefined, filters: ReportFilters): boolean {
  if (!dateStr) return true
  if (filters.dateFrom && dateStr < filters.dateFrom) return false
  if (filters.dateTo && dateStr > filters.dateTo) return false
  return true
}

/** Short "Mon 'YY" bucket label used to group time series by month. */
export function monthKeyFromDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export function monthKey(dateStr: string): string {
  return monthKeyFromDate(new Date(dateStr))
}
