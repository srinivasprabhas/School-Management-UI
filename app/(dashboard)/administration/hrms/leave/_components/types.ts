export interface UnifiedLeaveRow {
  /** Unique row id for the DataTable — safe to use across both sources. */
  id: string
  /** Which store this row's data actually lives in. */
  source: "staff" | "teacher"
  /** staffId (staff store) or teacherId (teacher store) — target for update(). */
  sourceId: string
  /** The id to match within the owning collection when updating. */
  originalId: string
  staffName: string
  role: string
  leaveType: string
  fromDate: string
  toDate: string
  daysCount: number
  reason: string
  status: "pending" | "approved" | "rejected"
  appliedDate: string
  approvedBy?: string
  approvedDate?: string
}
