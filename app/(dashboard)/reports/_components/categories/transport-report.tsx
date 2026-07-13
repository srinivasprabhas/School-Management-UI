"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartCard } from "@/components/shared/chart-card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useClassSections, useStudents, useVehicles } from "@/lib/data/store/entities"
import { classSectionMatches, type ReportFilters } from "../report-utils"

interface VehicleRow {
  id: string
  regNo: string
  type: string
  capacity: number
  riders: number
  occupancyPct: number
  driverName: string
  status: string
}

const columns: ColumnDef<VehicleRow>[] = [
  { accessorKey: "regNo", header: "Vehicle" },
  { accessorKey: "type", header: "Type", cell: ({ row }) => <span className="capitalize">{row.original.type}</span> },
  { accessorKey: "capacity", header: "Capacity" },
  { accessorKey: "riders", header: "Riders" },
  { id: "occupancyPct", header: "Occupancy %", cell: ({ row }) => `${row.original.occupancyPct}%` },
  { accessorKey: "driverName", header: "Driver" },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge label={row.original.status} tone={toneForStatus(row.original.status)} className="capitalize" />
    ),
  },
]

const chartConfig: ChartConfig = { occupancyPct: { label: "Occupancy %", color: "var(--chart-3)" } }

/**
 * Category 6: Transport — minimal read-only consumption of useVehicles()/routeId,
 * cross-referenced with Student.busRouteId to compute riders per route. No Vehicle/Route
 * CRUD is built here (owned by the Transport module). The date range filter doesn't apply
 * (vehicles/routes carry no per-record date); the class/section filter narrows which
 * students count as riders.
 */
export function TransportReport({ filters }: { filters: ReportFilters }) {
  const { items: vehicles } = useVehicles()
  const { items: students } = useStudents()
  const { items: classSections } = useClassSections()
  const classSectionById = useMemo(() => new Map(classSections.map((cs) => [cs.id, cs])), [classSections])

  const riderCountByRoute = useMemo(() => {
    const counts = new Map<string, number>()
    students
      .filter((s) => s.busRouteId)
      .filter((s) => {
        const cs = classSectionById.get(s.classSectionId)
        return cs && classSectionMatches(cs, filters)
      })
      .forEach((s) => counts.set(s.busRouteId!, (counts.get(s.busRouteId!) ?? 0) + 1))
    return counts
  }, [students, classSectionById, filters])

  const rows = useMemo<VehicleRow[]>(
    () =>
      vehicles.map((v) => {
        const riders = v.routeId ? riderCountByRoute.get(v.routeId) ?? 0 : 0
        return {
          id: v.id,
          regNo: v.regNo,
          type: v.type,
          capacity: v.capacity,
          riders,
          occupancyPct: v.capacity ? Math.round((riders / v.capacity) * 100) : 0,
          driverName: v.driverName,
          status: v.status,
        }
      }),
    [vehicles, riderCountByRoute]
  )

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="Route Occupancy" description="Riders as a percentage of vehicle capacity" config={chartConfig}>
        <BarChart data={rows.map((r) => ({ label: r.regNo, occupancyPct: r.occupancyPct }))} margin={{ left: 0, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="occupancyPct" fill="var(--color-occupancyPct)" radius={4} />
        </BarChart>
      </ChartCard>
      <DataTable columns={columns} data={rows} emptyTitle="No vehicles found" />
    </div>
  )
}
