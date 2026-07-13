"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { DownloadIcon, PlusIcon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/shared/data-table/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { useClassSections, useSubjects, useTeachers } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { DEPARTMENTS } from "@/lib/data/seed/pools"
import type { Teacher } from "@/lib/data/types"
import { buildTeacherColumns } from "./columns"
import { TeacherFormSheet } from "./teacher-form-sheet"
import { AssignClassDialog } from "./assign-class-dialog"

export function TeachersTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: teachers, add, update, remove } = useTeachers()
  const { items: classSections } = useClassSections()
  const { items: subjects } = useSubjects()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | undefined>(undefined)
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null)
  const [deactivatingTeacher, setDeactivatingTeacher] = useState<Teacher | null>(null)
  const [assigningTeacher, setAssigningTeacher] = useState<Teacher | undefined>(undefined)
  const [assignOpen, setAssignOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setEditingTeacher(undefined)
      setFormOpen(true)
    }
  }, [searchParams])

  const classSectionsById = useMemo(
    () => new Map(classSections.map((cs) => [cs.id, cs])),
    [classSections]
  )
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  const columns = useMemo(
    () =>
      buildTeacherColumns({
        classSectionsById,
        subjectsById,
        onView: (t) => router.push(`/teachers/${t.id}`),
        onEdit: (t) => {
          setEditingTeacher(t)
          setFormOpen(true)
        },
        onAssignClass: (t) => {
          setAssigningTeacher(t)
          setAssignOpen(true)
        },
        onDeactivate: (t) => setDeactivatingTeacher(t),
        onDelete: (t) => setDeletingTeacher(t),
      }),
    [classSectionsById, subjectsById, router]
  )

  const departmentFilterOptions = useMemo(
    () => DEPARTMENTS.map((d) => ({ label: d, value: d })),
    []
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teachers"
        description={`${teachers.length} teachers on record across ${DEPARTMENTS.length} departments.`}
        actions={
          <>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger render={<Button variant="outline" />}>
                <UploadIcon data-icon="inline-start" />
                Import
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Teachers</DialogTitle>
                  <DialogDescription>
                    Upload an Excel or CSV file matching the teacher template.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <UploadIcon className="size-6" />
                  Drag and drop a file here, or click to browse
                </div>
                <DialogFooter>
                  <Button variant="ghost" type="button" onClick={() => setImportOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setImportOpen(false)
                      toast.success("Import complete", { description: "8 teachers imported." })
                    }}
                  >
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Export started", {
                  description: `Exporting ${teachers.length} teachers to Excel…`,
                })
              }
            >
              <DownloadIcon data-icon="inline-start" />
              Export
            </Button>
            <Button
              onClick={() => {
                setEditingTeacher(undefined)
                setFormOpen(true)
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Add Teacher
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={teachers}
        searchKey="name"
        searchPlaceholder="Search by name…"
        filters={[{ columnId: "department", title: "Department", options: departmentFilterOptions }]}
        onRowClick={(t) => router.push(`/teachers/${t.id}`)}
        emptyTitle="No teachers found"
        emptyDescription="Try adjusting your filters, or add your first teacher."
      />

      <TeacherFormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            const params = new URLSearchParams(searchParams.toString())
            if (params.has("action")) {
              params.delete("action")
              router.replace(`/teachers${params.toString() ? `?${params}` : ""}`)
            }
          }
        }}
        teacher={editingTeacher}
        onSubmit={(teacher) => {
          if (editingTeacher) {
            update(teacher.id, teacher)
          } else {
            add(teacher)
          }
        }}
      />

      <AssignClassDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        teacher={assigningTeacher}
        onSubmit={(assignedClasses) => {
          if (!assigningTeacher) return
          update(assigningTeacher.id, { assignedClasses })
        }}
      />

      <ConfirmDialog
        open={!!deletingTeacher}
        onOpenChange={(open) => !open && setDeletingTeacher(null)}
        title="Delete teacher record?"
        description={`This will permanently remove ${deletingTeacher?.firstName} ${deletingTeacher?.lastName}'s record. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingTeacher) return
          remove(deletingTeacher.id)
          logActivity({
            action: "delete",
            module: "Teachers",
            entityType: "Teacher",
            entityId: deletingTeacher.id,
            description: `Deleted teacher ${deletingTeacher.firstName} ${deletingTeacher.lastName}`,
          })
          toast.success("Teacher deleted")
          setDeletingTeacher(null)
        }}
      />

      <ConfirmDialog
        open={!!deactivatingTeacher}
        onOpenChange={(open) => !open && setDeactivatingTeacher(null)}
        title="Deactivate teacher?"
        description={`${deactivatingTeacher?.firstName} ${deactivatingTeacher?.lastName} will be marked inactive.`}
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (!deactivatingTeacher) return
          update(deactivatingTeacher.id, { status: "inactive" })
          toast.success("Teacher deactivated")
          setDeactivatingTeacher(null)
        }}
      />
    </div>
  )
}
