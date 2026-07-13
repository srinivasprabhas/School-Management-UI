"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { useMaintenanceLogs } from "@/lib/data/store/entities"
import { formatCurrency, formatDate } from "@/lib/format"
import type { MaintenanceLog, Vehicle } from "@/lib/data/types"

const columns: ColumnDef<MaintenanceLog>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
  {
    accessorKey: "odometer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Odometer" />,
    cell: ({ getValue }) => `${getValue<number>().toLocaleString()} km`,
  },
  {
    accessorKey: "fuelLiters",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fuel" />,
    cell: ({ getValue }) => `${getValue<number>()} L`,
  },
  {
    accessorKey: "cost",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
    cell: ({ getValue }) => formatCurrency(getValue<number>()),
  },
  {
    accessorKey: "note",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Note" />,
  },
]

interface VehicleLogsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
}

export function VehicleLogsSheet({ open, onOpenChange, vehicle }: VehicleLogsSheetProps) {
  const { items: logs } = useMaintenanceLogs()

  const vehicleLogs = useMemo(
    () =>
      vehicle
        ? logs
            .filter((l) => l.vehicleId === vehicle.id)
            .sort((a, b) => (a.date < b.date ? 1 : -1))
        : [],
    [logs, vehicle]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Maintenance Logs — {vehicle?.regNo}</SheetTitle>
          <SheetDescription>
            Service history for this vehicle, most recent first.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <DataTable
            columns={columns}
            data={vehicleLogs}
            pageSize={5}
            emptyTitle="No maintenance logs"
            emptyDescription="No service history recorded for this vehicle yet."
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
