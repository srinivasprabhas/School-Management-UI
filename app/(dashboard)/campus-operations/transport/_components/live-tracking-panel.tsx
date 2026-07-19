"use client"

import { useMemo, useState } from "react"
import { BusIcon, PauseIcon, PlayIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { StatCard } from "@/components/shared/stat-card"
import { useBusSimulation } from "@/hooks/use-bus-simulation"
import { useRoutes, useVehicles } from "@/lib/data/store/entities"
import {
  SYNTHETIC_STATUS_LABEL,
  deriveSyntheticStatus,
  type SyntheticStatus,
} from "@/lib/transport/route-geometry"
import { cn } from "@/lib/utils"
import { RouteMap } from "./route-map"

const SPEED_OPTIONS = [
  { value: "0.5", label: "0.5x" },
  { value: "1", label: "1x" },
  { value: "2", label: "2x" },
]

const STATUS_ORDER: SyntheticStatus[] = ["on-route", "idle", "out-of-service"]

const STATUS_DOT_CLASS: Record<SyntheticStatus, string> = {
  "on-route": "bg-success",
  idle: "bg-warning",
  "out-of-service": "bg-destructive",
}

export function LiveTrackingPanel() {
  const { items: vehicles } = useVehicles()
  const { items: routes } = useRoutes()
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const positions = useBusSimulation({ vehicles, routes, playing, speed })
  const routesById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes])

  const counts = useMemo(() => {
    const result: Record<SyntheticStatus, number> = { "on-route": 0, idle: 0, "out-of-service": 0 }
    for (const vehicle of vehicles) {
      const route = vehicle.routeId ? routesById.get(vehicle.routeId) : undefined
      result[deriveSyntheticStatus(vehicle, route)] += 1
    }
    return result
  }, [vehicles, routesById])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Buses" value={vehicles.length} icon={BusIcon} variant="primary" />
        <StatCard title="On Route" value={counts["on-route"]} variant="success" />
        <StatCard title="Idle" value={counts.idle} variant="warning" />
        <StatCard title="Out of Service" value={counts["out-of-service"]} variant="destructive" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
            {playing ? (
              <PauseIcon data-icon="inline-start" />
            ) : (
              <PlayIcon data-icon="inline-start" />
            )}
            {playing ? "Pause" : "Play"}
          </Button>
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            value={[String(speed)]}
            onValueChange={(next) => {
              if (next.length > 0) setSpeed(Number(next[0]))
            }}
          >
            {SPEED_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} className="px-2.5 text-xs">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", STATUS_DOT_CLASS[status])} />
              {SYNTHETIC_STATUS_LABEL[status]}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent>
            <RouteMap
              routes={routes}
              vehicles={vehicles}
              positions={positions}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fleet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {vehicles.map((vehicle) => {
              const route = vehicle.routeId ? routesById.get(vehicle.routeId) : undefined
              const status = deriveSyntheticStatus(vehicle, route)
              const isSelected = vehicle.id === selectedVehicleId
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted/50",
                    isSelected && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{vehicle.regNo}</span>
                    <span className="text-xs text-muted-foreground">{route?.name ?? "Unassigned"}</span>
                  </div>
                  <span className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])} />
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
