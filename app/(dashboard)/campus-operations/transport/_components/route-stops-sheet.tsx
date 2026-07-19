"use client"

import { useMemo } from "react"
import { UsersIcon } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useBusSimulation } from "@/hooks/use-bus-simulation"
import { useVehicles } from "@/lib/data/store/entities"
import type { TransportRoute } from "@/lib/data/types"
import { RouteMap } from "./route-map"

interface RouteStopsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: TransportRoute | null
}

export function RouteStopsSheet({ open, onOpenChange, route }: RouteStopsSheetProps) {
  const { items: vehicles } = useVehicles()
  const stops = route ? [...route.stops].sort((a, b) => a.sequence - b.sequence) : []

  const routeVehicle = useMemo(
    () => vehicles.find((v) => v.id === route?.vehicleId),
    [vehicles, route]
  )
  const mapRoutes = useMemo(() => (route ? [route] : []), [route])
  const mapVehicles = useMemo(() => (routeVehicle ? [routeVehicle] : []), [routeVehicle])
  const positions = useBusSimulation({
    routes: mapRoutes,
    vehicles: mapVehicles,
    playing: open,
    speed: 1,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{route?.name} — Stops</SheetTitle>
          <SheetDescription>
            Ordered pickup and drop schedule for this route ({route?.totalDistanceKm} km).
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="overflow-hidden rounded-lg border">
            <RouteMap routes={mapRoutes} vehicles={mapVehicles} positions={positions} showStopLabels />
          </div>

          <div className="flex flex-col gap-2">
            {stops.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stops defined for this route.</p>
            ) : (
              stops.map((stop) => (
                <div
                  key={`${stop.sequence}-${stop.name}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-6 w-6 justify-center rounded-full p-0">
                      {stop.sequence}
                    </Badge>
                    <div className="flex flex-col">
                      <span className="font-medium">{stop.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Pickup {stop.pickupTime} · Drop {stop.dropTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <UsersIcon className="size-3.5" />
                    {stop.studentsCount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
