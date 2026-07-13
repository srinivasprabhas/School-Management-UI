"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { useLogActivity } from "@/lib/data/audit"
import { useClassSections, useStudents, useTeachers } from "@/lib/data/store/entities"
import type { ClassSection } from "@/lib/data/types"
import { AddClassDialog } from "./add-class-dialog"
import { AssignTeacherDialog } from "./assign-teacher-dialog"
import { buildClassSectionColumns } from "./columns"
import { EditSectionDialog } from "./edit-section-dialog"

export function ClassesSectionsView() {
  const router = useRouter()
  const { items: classSections, update, remove } = useClassSections()
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const logActivity = useLogActivity()

  const [addOpen, setAddOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<ClassSection | null>(null)
  const [assigningSection, setAssigningSection] = useState<ClassSection | null>(null)
  const [deletingSection, setDeletingSection] = useState<ClassSection | null>(null)

  const teachersById = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])
  const studentCountBySection = useMemo(() => {
    const counts = new Map<string, number>()
    students.forEach((s) => counts.set(s.classSectionId, (counts.get(s.classSectionId) ?? 0) + 1))
    return counts
  }, [students])

  const columns = useMemo(
    () =>
      buildClassSectionColumns({
        teachersById,
        studentCountBySection,
        onViewStudents: (cs) => router.push(`/students?classSectionId=${cs.id}`),
        onEdit: (cs) => setEditingSection(cs),
        onAssignTeacher: (cs) => setAssigningSection(cs),
        onDelete: (cs) => setDeletingSection(cs),
      }),
    [teachersById, studentCountBySection, router]
  )

  const deleteStudentCount = deletingSection ? studentCountBySection.get(deletingSection.id) ?? 0 : 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Classes & Sections"
        description={`${classSections.length} sections across the school.`}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Add Class
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={classSections}
        searchKey="className"
        searchPlaceholder="Search by class name…"
        emptyTitle="No classes found"
        emptyDescription="Add your first class to get started."
      />

      <AddClassDialog open={addOpen} onOpenChange={setAddOpen} />

      <EditSectionDialog
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
        section={editingSection}
        onSubmit={(patch) => {
          if (!editingSection) return
          update(editingSection.id, patch)
          logActivity({
            action: "update",
            module: "Academics",
            entityType: "ClassSection",
            entityId: editingSection.id,
            description: `Updated section ${editingSection.className} ${editingSection.section}`,
          })
          toast.success("Section updated")
          setEditingSection(null)
        }}
      />

      <AssignTeacherDialog
        open={!!assigningSection}
        onOpenChange={(open) => !open && setAssigningSection(null)}
        section={assigningSection}
        onSubmit={(teacherId) => {
          if (!assigningSection) return
          update(assigningSection.id, { classTeacherId: teacherId })
          logActivity({
            action: "update",
            module: "Academics",
            entityType: "ClassSection",
            entityId: assigningSection.id,
            description: `Assigned class teacher for ${assigningSection.className} ${assigningSection.section}`,
          })
          toast.success("Class teacher assigned")
          setAssigningSection(null)
        }}
      />

      <ConfirmDialog
        open={!!deletingSection}
        onOpenChange={(open) => !open && setDeletingSection(null)}
        title="Delete class section?"
        description={
          deletingSection
            ? deleteStudentCount > 0
              ? `${deletingSection.className} ${deletingSection.section} has ${deleteStudentCount} student(s) enrolled. Deleting it will not remove those students, but they'll be left without a valid section. This action cannot be undone.`
              : `This will permanently remove ${deletingSection.className} — Section ${deletingSection.section}. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingSection) return
          remove(deletingSection.id)
          logActivity({
            action: "delete",
            module: "Academics",
            entityType: "ClassSection",
            entityId: deletingSection.id,
            description: `Deleted section ${deletingSection.className} ${deletingSection.section}`,
          })
          toast.success("Section deleted")
          setDeletingSection(null)
        }}
      />
    </div>
  )
}
