"use client"

import { useMemo, useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { useClassSections, useLessonPlans, useSubjects, useTeachers } from "@/lib/data/store/entities"
import { buildLessonPlanColumns } from "./lesson-plan-columns"
import { LessonPlanFormDialog } from "./lesson-plan-form-dialog"

export function LessonPlansTab() {
  const { items: lessonPlans, add } = useLessonPlans()
  const { items: subjects } = useSubjects()
  const { items: classSections } = useClassSections()
  const { items: teachers } = useTeachers()

  const [formOpen, setFormOpen] = useState(false)

  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const classSectionsById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])
  const teachersById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])

  const columns = useMemo(
    () => buildLessonPlanColumns({ subjectsById, classSectionsById, teachersById }),
    [subjectsById, classSectionsById, teachersById]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add Lesson Plan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={lessonPlans}
        searchKey="topic"
        searchPlaceholder="Search by topic…"
        emptyTitle="No lesson plans found"
        emptyDescription="Add your first lesson plan to get started."
      />

      <LessonPlanFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={(plan) => add(plan)} />
    </div>
  )
}
