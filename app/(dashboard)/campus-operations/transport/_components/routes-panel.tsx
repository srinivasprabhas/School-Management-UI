"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ListIcon, PlusIcon, RouteIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { useRoutes, useVehicles } from "@/lib/data/store/entities"
import type { TransportRoute, Vehicle } from "@/lib/data/types"
import { RouteFormDialog } from "./route-form-dialog"
import { RouteStopsSheet } from "./route-stops-sheet"

function buildRouteColumns(args: {
  vehiclesById: Map<string, Vehicle>
  onViewStops: (r: TransportRoute) => void
}): ColumnDef<TransportRoute>[] {
  const actions: RowAction<TransportRoute>[] = [
    { label: "View Stops", icon: ListIcon, onSelect: args.onViewStops },
  ]

  return [
    createSelectColumn<TransportRoute>(),
    {
      id: "name",
      accessorFn: (r) => r.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Route Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <RouteIcon className="size-4" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "vehicle",
      accessorFn: (r) => (r.vehicleId ? args.vehiclesById.get(r.vehicleId)?.regNo ?? "" : ""),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned Vehicle" />,
      cell: ({ getValue }) => {
        const regNo = getValue<string>()
        return regNo ? <span>{regNo}</span> : <span className="text-muted-foreground">Unassigned</span>
      },
    },
    {
      id: "stopsCount",
      accessorFn: (r) => r.stops.length,
      header: ({ column }) => <DataTableColumnHeader column={column} title="#Stops" />,
    },
    {
      id: "totalStudents",
      accessorFn: (r) => r.stops.reduce((sum, s) => sum + s.studentsCount, 0),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Students" />,
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
    createActionsColumn<TransportRoute>(actions),
  ]
}

export function RoutesPanel() {
  const { items: routes, add } = useRoutes()
  const { items: vehicles } = useVehicles()

  const [formOpen, setFormOpen] = useState(false)
  const [stopsRoute, setStopsRoute] = useState<TransportRoute | null>(null)

  const vehiclesById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])

  const columns = useMemo(
    () =>
      buildRouteColumns({
        vehiclesById,
        onViewStops: (r) => setStopsRoute(r),
      }),
    [vehiclesById]
  )

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={routes}
        searchKey="name"
        searchPlaceholder="Search by route name…"
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
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Add Route
          </Button>
        }
        emptyTitle="No routes found"
        emptyDescription="Add your first bus route to get started."
      />

      <RouteFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={(route) => add(route)} />

      <RouteStopsSheet
        open={!!stopsRoute}
        onOpenChange={(open) => !open && setStopsRoute(null)}
        route={stopsRoute}
      />
    </div>
  )
}
