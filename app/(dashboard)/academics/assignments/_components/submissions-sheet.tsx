"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/status-badge"
import { useStudents } from "@/lib/data/store/entities"
import type { Assignment } from "@/lib/data/types"

interface SubmissionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
}

/**
 * Read-only per-student status list — fabricated proportionally to submittedCount
 * (the first N students by roll number are shown as "Submitted"). This is a status
 * list only, not a grading/marks-entry UI.
 */
export function SubmissionsSheet({ open, onOpenChange, assignment }: SubmissionsSheetProps) {
  const { items: students } = useStudents()

  const roster = assignment
    ? students
        .filter((s) => s.classSectionId === assignment.classSectionId)
        .sort((a, b) => a.rollNo - b.rollNo)
    : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Submissions</SheetTitle>
          <SheetDescription>
            {assignment
              ? `${assignment.title} — ${assignment.submittedCount}/${assignment.totalStudents} submitted`
              : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-1.5 px-4 pb-4">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found for this class section.</p>
          ) : (
            roster.map((s, i) => {
              const submitted = assignment ? i < assignment.submittedCount : false
              return (
                <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">Roll No. {s.rollNo}</span>
                  </div>
                  <StatusBadge label={submitted ? "Submitted" : "Pending"} tone={submitted ? "success" : "warning"} />
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
