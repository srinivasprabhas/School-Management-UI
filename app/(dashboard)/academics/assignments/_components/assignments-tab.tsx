"use client"

import { useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { useAssignments, useClassSections, useSubjects, useTeachers } from "@/lib/data/store/entities"
import type { Assignment } from "@/lib/data/types"
import { buildAssignmentColumns } from "./assignment-columns"
import { AssignmentFormDialog } from "./assignment-form-dialog"
import { SubmissionsSheet } from "./submissions-sheet"

const STATUS_FILTER_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
]

export function AssignmentsTab() {
  const { items: assignments, add } = useAssignments()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const { items: teachers } = useTeachers()

  const [formOpen, setFormOpen] = useState(false)
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null)

  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const teachersById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])

  const columns = useMemo(
    () =>
      buildAssignmentColumns({
        classSectionsById,
        subjectsById,
        teachersById,
        onViewSubmissions: (a) => setViewingAssignment(a),
      }),
    [classSectionsById, subjectsById, teachersById]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add Assignment
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        searchKey="title"
        searchPlaceholder="Search by title…"
        filters={[{ columnId: "status", title: "Status", options: STATUS_FILTER_OPTIONS }]}
        emptyTitle="No assignments found"
        emptyDescription="Add your first assignment to get started."
      />

      <AssignmentFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={(assignment) => add(assignment)} />

      <SubmissionsSheet
        open={!!viewingAssignment}
        onOpenChange={(open) => !open && setViewingAssignment(null)}
        assignment={viewingAssignment}
      />
    </div>
  )
}
