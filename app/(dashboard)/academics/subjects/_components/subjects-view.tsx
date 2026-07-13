"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { useLogActivity } from "@/lib/data/audit"
import { useClasses, useSubjects, useTeachers } from "@/lib/data/store/entities"
import type { Subject } from "@/lib/data/types"
import { buildSubjectColumns } from "./columns"
import { SubjectFormDialog } from "./subject-form-dialog"

const TYPE_FILTER_OPTIONS = [
  { label: "Core", value: "core" },
  { label: "Elective", value: "elective" },
  { label: "Extra Curricular", value: "extra_curricular" },
]

export function SubjectsView() {
  const { items: subjects, add, update, remove } = useSubjects()
  const { items: classes } = useClasses()
  const { items: teachers } = useTeachers()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined)
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null)

  const classesById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes])
  const teachersById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])

  const columns = useMemo(
    () =>
      buildSubjectColumns({
        classesById,
        teachersById,
        onEdit: (s) => {
          setEditingSubject(s)
          setFormOpen(true)
        },
        onDelete: (s) => setDeletingSubject(s),
      }),
    [classesById, teachersById]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        description={`${subjects.length} subjects in the catalog.`}
        actions={
          <Button
            onClick={() => {
              setEditingSubject(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add Subject
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={subjects}
        searchKey="name"
        searchPlaceholder="Search by subject name…"
        filters={[{ columnId: "type", title: "Type", options: TYPE_FILTER_OPTIONS }]}
        emptyTitle="No subjects found"
        emptyDescription="Add your first subject to get started."
      />

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingSubject(undefined)
        }}
        subject={editingSubject}
        onSubmit={(subject) => {
          if (editingSubject) update(subject.id, subject)
          else add(subject)
        }}
      />

      <ConfirmDialog
        open={!!deletingSubject}
        onOpenChange={(open) => !open && setDeletingSubject(null)}
        title="Delete subject?"
        description={`This will permanently remove ${deletingSubject?.name ?? ""} from the subject catalog. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingSubject) return
          remove(deletingSubject.id)
          logActivity({
            action: "delete",
            module: "Academics",
            entityType: "Subject",
            entityId: deletingSubject.id,
            description: `Deleted subject ${deletingSubject.name}`,
          })
          toast.success("Subject deleted")
          setDeletingSubject(null)
        }}
      />
    </div>
  )
}
