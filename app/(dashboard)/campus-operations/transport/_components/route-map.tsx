"use client"

import { BuildingIcon, BusIcon, UsersIcon } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  CAMPUS,
  MAP_HEIGHT,
  MAP_WIDTH,
  SYNTHETIC_STATUS_LABEL,
  SYNTHETIC_STATUS_TONE,
  getRouteLayout,
  type SyntheticStatus,
} from "@/lib/transport/route-geometry"
import type { BusPosition } from "@/hooks/use-bus-simulation"
import type { TransportRoute, Vehicle } from "@/lib/data/types"
import { cn } from "@/lib/utils"

const ROUTE_COLOR_VARS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

function routeColor(index: number, routeCount: number) {
  return routeCount <= 1 ? "var(--color-primary)" : ROUTE_COLOR_VARS[index % ROUTE_COLOR_VARS.length]
}

/** Solid marker backgrounds (not the subtle badge-style toneBgClass tint) — a bus marker needs
 * good contrast for its white icon glyph, unlike a badge's low-opacity tint. */
const MARKER_BG_CLASS: Record<SyntheticStatus, string> = {
  "on-route": "bg-success",
  idle: "bg-warning",
  "out-of-service": "bg-destructive",
}

interface RouteMapProps {
  routes: TransportRoute[]
  vehicles: Vehicle[]
  positions: Map<string, BusPosition>
  selectedVehicleId?: string | null
  onSelectVehicle?: (id: string) => void
  showStopLabels?: boolean
}

export function RouteMap({
  routes,
  vehicles,
  positions,
  selectedVehicleId,
  onSelectVehicle,
  showStopLabels = false,
}: RouteMapProps) {
  const routesById = new Map(routes.map((r) => [r.id, r]))

  return (
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-auto w-full">
      <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} rx={16} className="fill-muted/30" />

      {routes.map((route, index) => {
        const layout = getRouteLayout(route, index, routes.length)
        const color = routeColor(index, routes.length)
        const points = layout.waypoints.map((p) => `${p.x},${p.y}`).join(" ")
        return (
          <g key={route.id}>
            <polyline
              points={points}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
              className="fill-none"
            />
            {layout.stopPoints.map(({ stop, point }) => (
              <g key={stop.sequence}>
                <circle cx={point.x} cy={point.y} r={6} stroke={color} strokeWidth={2} className="fill-background">
                  <title>{`${stop.name} — pickup ${stop.pickupTime}, drop ${stop.dropTime} (${stop.studentsCount} students)`}</title>
                </circle>
                {showStopLabels ? (
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    fontSize={13}
                    className="fill-foreground font-medium"
                  >
                    {stop.name}
                  </text>
                ) : null}
              </g>
            ))}
          </g>
        )
      })}

      <g>
        <circle cx={CAMPUS.x} cy={CAMPUS.y} r={16} className="fill-primary">
          <title>Campus</title>
        </circle>
        <foreignObject x={CAMPUS.x - 12} y={CAMPUS.y - 12} width={24} height={24}>
          <div className="flex size-full items-center justify-center text-primary-foreground">
            <BuildingIcon className="h-[65%] w-[65%]" />
          </div>
        </foreignObject>
      </g>

      {vehicles.map((vehicle) => {
        const position = positions.get(vehicle.id)
        if (!position) return null
        const route = vehicle.routeId ? routesById.get(vehicle.routeId) : undefined
        const isSelected = vehicle.id === selectedVehicleId

        return (
          <g
            key={vehicle.id}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className="transition-transform duration-75 ease-linear"
          >
            {isSelected ? (
              <circle r={14} className="fill-none stroke-primary stroke-2 animate-pulse" />
            ) : null}
            <foreignObject x={-15} y={-15} width={30} height={30}>
              <Popover>
                <PopoverTrigger
                  onClick={() => onSelectVehicle?.(vehicle.id)}
                  className={cn(
                    "flex size-full items-center justify-center rounded-full text-white ring-2 ring-background shadow-sm",
                    MARKER_BG_CLASS[position.status]
                  )}
                >
                  <BusIcon className="h-[55%] w-[55%]" />
                </PopoverTrigger>
                <PopoverContent align="center" className="w-64">
                  <PopoverHeader>
                    <PopoverTitle>{vehicle.regNo}</PopoverTitle>
                  </PopoverHeader>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <StatusBadge
                      label={SYNTHETIC_STATUS_LABEL[position.status]}
                      tone={SYNTHETIC_STATUS_TONE[position.status]}
                      className="w-fit"
                    />
                    <div className="text-muted-foreground">
                      Driver: <span className="text-foreground">{vehicle.driverName}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Route: <span className="text-foreground">{route?.name ?? "Unassigned"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <UsersIcon className="size-3.5" />
                      Capacity {vehicle.capacity}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </foreignObject>
          </g>
        )
      })}
    </svg>
  )
}
