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
import { useClassSections, useStudents } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { Student } from "@/lib/data/types"
import { buildStudentColumns } from "./columns"
import { StudentFormSheet } from "./student-form-sheet"

export function StudentsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: students, add, update, remove } = useStudents()
  const { items: classSections } = useClassSections()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [deactivatingStudent, setDeactivatingStudent] = useState<Student | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setEditingStudent(undefined)
      setFormOpen(true)
    }
  }, [searchParams])

  const classSectionsById = useMemo(
    () => new Map(classSections.map((cs) => [cs.id, cs])),
    [classSections]
  )

  const columns = useMemo(
    () =>
      buildStudentColumns({
        classSectionsById,
        onView: (s) => router.push(`/students/${s.id}`),
        onEdit: (s) => {
          setEditingStudent(s)
          setFormOpen(true)
        },
        onTakeAttendance: (s) =>
          router.push(`/attendance?classSectionId=${s.classSectionId}&studentId=${s.id}`),
        onCollectFee: (s) => router.push(`/fees/collect?studentId=${s.id}`),
        onDeactivate: (s) => setDeactivatingStudent(s),
        onDelete: (s) => setDeletingStudent(s),
      }),
    [classSectionsById, router]
  )

  const classFilterOptions = useMemo(
    () =>
      classSections.map((cs) => ({
        label: `${cs.className} — ${cs.section}`,
        value: `${cs.className} ${cs.section}`,
      })),
    [classSections]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description={`${students.length} students enrolled across ${classSections.length} class sections.`}
        actions={
          <>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger render={<Button variant="outline" />}>
                <UploadIcon data-icon="inline-start" />
                Import
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Students</DialogTitle>
                  <DialogDescription>
                    Upload an Excel or CSV file matching the student template.
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
                      toast.success("Import complete", { description: "12 students imported." })
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
                  description: `Exporting ${students.length} students to Excel…`,
                })
              }
            >
              <DownloadIcon data-icon="inline-start" />
              Export
            </Button>
            <Button
              onClick={() => {
                setEditingStudent(undefined)
                setFormOpen(true)
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Add Student
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={students}
        searchKey="name"
        searchPlaceholder="Search by name…"
        filters={[
          { columnId: "class", title: "Class", options: classFilterOptions },
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        onRowClick={(s) => router.push(`/students/${s.id}`)}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your filters, or add your first student."
      />

      <StudentFormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            const params = new URLSearchParams(searchParams.toString())
            if (params.has("action")) {
              params.delete("action")
              router.replace(`/students${params.toString() ? `?${params}` : ""}`)
            }
          }
        }}
        student={editingStudent}
        onSubmit={(student) => {
          if (editingStudent) {
            update(student.id, student)
          } else {
            add(student)
          }
        }}
      />

      <ConfirmDialog
        open={!!deletingStudent}
        onOpenChange={(open) => !open && setDeletingStudent(null)}
        title="Delete student record?"
        description={`This will permanently remove ${deletingStudent?.firstName} ${deletingStudent?.lastName}'s record. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingStudent) return
          remove(deletingStudent.id)
          logActivity({
            action: "delete",
            module: "Students",
            entityType: "Student",
            entityId: deletingStudent.id,
            description: `Deleted student ${deletingStudent.firstName} ${deletingStudent.lastName}`,
          })
          toast.success("Student deleted")
          setDeletingStudent(null)
        }}
      />

      <ConfirmDialog
        open={!!deactivatingStudent}
        onOpenChange={(open) => !open && setDeactivatingStudent(null)}
        title="Deactivate student?"
        description={`${deactivatingStudent?.firstName} ${deactivatingStudent?.lastName} will be marked inactive and hidden from active rosters.`}
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (!deactivatingStudent) return
          update(deactivatingStudent.id, { status: "inactive" })
          toast.success("Student deactivated")
          setDeactivatingStudent(null)
        }}
      />
    </div>
  )
}
