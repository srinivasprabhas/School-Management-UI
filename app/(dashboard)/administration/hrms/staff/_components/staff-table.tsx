"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { useStaffMembers } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { StaffMember } from "@/lib/data/types"
import { buildStaffColumns } from "./columns"
import { StaffFormDialog } from "./staff-form-dialog"
import { StaffProfileSheet } from "./staff-profile-sheet"

export function StaffTable() {
  const { items: staff, add, update, remove } = useStaffMembers()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>(undefined)
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)
  const [deactivatingStaff, setDeactivatingStaff] = useState<StaffMember | null>(null)

  const departmentOptions = useMemo(() => {
    const depts = [...new Set(staff.map((s) => s.department))]
    return depts.map((d) => ({ label: d, value: d }))
  }, [staff])

  const columns = useMemo(
    () =>
      buildStaffColumns({
        onView: (s) => setViewingStaff(s),
        onEdit: (s) => {
          setEditingStaff(s)
          setFormOpen(true)
        },
        onDeactivate: (s) => setDeactivatingStaff(s),
        onDelete: (s) => setDeletingStaff(s),
      }),
    []
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff Directory"
        description={`${staff.length} staff members on record.`}
        actions={
          <Button
            onClick={() => {
              setEditingStaff(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add Staff
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={staff}
        searchKey="name"
        searchPlaceholder="Search by name…"
        filters={[
          { columnId: "department", title: "Department", options: departmentOptions },
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        onRowClick={(s) => setViewingStaff(s)}
        emptyTitle="No staff found"
        emptyDescription="Try adjusting your filters, or add your first staff member."
      />

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        staff={editingStaff}
        onSubmit={(s) => {
          if (editingStaff) {
            update(s.id, s)
          } else {
            add(s)
          }
        }}
      />

      <StaffProfileSheet
        open={!!viewingStaff}
        onOpenChange={(open) => !open && setViewingStaff(null)}
        staff={viewingStaff}
      />

      <ConfirmDialog
        open={!!deletingStaff}
        onOpenChange={(open) => !open && setDeletingStaff(null)}
        title="Delete staff record?"
        description={`This will permanently remove ${deletingStaff?.name}'s record. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingStaff) return
          remove(deletingStaff.id)
          logActivity({
            action: "delete",
            module: "HRMS",
            entityType: "StaffMember",
            entityId: deletingStaff.id,
            description: `Deleted staff member ${deletingStaff.name}`,
          })
          toast.success("Staff member deleted")
          setDeletingStaff(null)
        }}
      />

      <ConfirmDialog
        open={!!deactivatingStaff}
        onOpenChange={(open) => !open && setDeactivatingStaff(null)}
        title="Deactivate staff member?"
        description={`${deactivatingStaff?.name} will be marked inactive.`}
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (!deactivatingStaff) return
          update(deactivatingStaff.id, { status: "inactive" })
          logActivity({
            action: "update",
            module: "HRMS",
            entityType: "StaffMember",
            entityId: deactivatingStaff.id,
            description: `Deactivated staff member ${deactivatingStaff.name}`,
          })
          toast.success("Staff member deactivated")
          setDeactivatingStaff(null)
        }}
      />
    </div>
  )
}
