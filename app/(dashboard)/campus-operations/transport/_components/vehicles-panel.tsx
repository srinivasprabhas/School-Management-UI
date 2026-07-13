"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  BusIcon,
  FileClockIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { useVehicles } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { Vehicle } from "@/lib/data/types"
import { VehicleFormDialog } from "./vehicle-form-dialog"
import { VehicleLogsSheet } from "./vehicle-logs-sheet"

const TYPE_LABEL: Record<Vehicle["type"], string> = {
  bus: "Bus",
  van: "Van",
  car: "Car",
}

function buildVehicleColumns(args: {
  onViewLogs: (v: Vehicle) => void
  onEdit: (v: Vehicle) => void
  onDeactivate: (v: Vehicle) => void
  onDelete: (v: Vehicle) => void
}): ColumnDef<Vehicle>[] {
  const actions: RowAction<Vehicle>[] = [
    { label: "View Logs", icon: FileClockIcon, onSelect: args.onViewLogs },
    { label: "Edit", icon: PencilIcon, onSelect: args.onEdit },
    {
      label: "Deactivate",
      icon: PowerIcon,
      onSelect: args.onDeactivate,
      hidden: (v) => v.status !== "active",
      separatorBefore: true,
    },
    { label: "Delete", icon: Trash2Icon, variant: "destructive", onSelect: args.onDelete },
  ]

  return [
    createSelectColumn<Vehicle>(),
    {
      id: "vehicle",
      accessorFn: (v) => v.regNo,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vehicle" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <BusIcon className="size-4" />
          </div>
          <span className="font-medium">{row.original.regNo}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ getValue }) => <Badge>{TYPE_LABEL[getValue<Vehicle["type"]>()]}</Badge>,
    },
    {
      id: "driver",
      accessorFn: (v) => v.driverName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Driver" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.driverName}</span>
          <span className="text-xs text-muted-foreground">{row.original.driverPhone}</span>
        </div>
      ),
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Capacity" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    createActionsColumn<Vehicle>(actions),
  ]
}

export function VehiclesPanel() {
  const { items: vehicles, add, update, remove } = useVehicles()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined)
  const [logsVehicle, setLogsVehicle] = useState<Vehicle | null>(null)
  const [deactivatingVehicle, setDeactivatingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)

  const columns = useMemo(
    () =>
      buildVehicleColumns({
        onViewLogs: (v) => setLogsVehicle(v),
        onEdit: (v) => {
          setEditingVehicle(v)
          setFormOpen(true)
        },
        onDeactivate: (v) => setDeactivatingVehicle(v),
        onDelete: (v) => setDeletingVehicle(v),
      }),
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={vehicles}
        searchKey="vehicle"
        searchPlaceholder="Search by registration no…"
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        toolbarActions={
          <Button
            onClick={() => {
              setEditingVehicle(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add Vehicle
          </Button>
        }
        emptyTitle="No vehicles found"
        emptyDescription="Add your first vehicle to start building the fleet."
      />

      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editingVehicle}
        onSubmit={(vehicle) => {
          if (editingVehicle) update(vehicle.id, vehicle)
          else add(vehicle)
        }}
      />

      <VehicleLogsSheet
        open={!!logsVehicle}
        onOpenChange={(open) => !open && setLogsVehicle(null)}
        vehicle={logsVehicle}
      />

      <ConfirmDialog
        open={!!deactivatingVehicle}
        onOpenChange={(open) => !open && setDeactivatingVehicle(null)}
        title="Deactivate vehicle?"
        description={`${deactivatingVehicle?.regNo} will be marked inactive and hidden from active route assignments.`}
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (!deactivatingVehicle) return
          update(deactivatingVehicle.id, { status: "inactive" })
          toast.success("Vehicle deactivated")
          setDeactivatingVehicle(null)
        }}
      />

      <ConfirmDialog
        open={!!deletingVehicle}
        onOpenChange={(open) => !open && setDeletingVehicle(null)}
        title="Delete vehicle?"
        description={`This will permanently remove ${deletingVehicle?.regNo} from the fleet. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingVehicle) return
          remove(deletingVehicle.id)
          logActivity({
            action: "delete",
            module: "Transport",
            entityType: "Vehicle",
            entityId: deletingVehicle.id,
            description: `Deleted vehicle ${deletingVehicle.regNo}`,
          })
          toast.success("Vehicle deleted")
          setDeletingVehicle(null)
        }}
      />
    </div>
  )
}
