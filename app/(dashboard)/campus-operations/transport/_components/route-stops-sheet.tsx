"use client"

import { MapPinIcon, UsersIcon } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { TransportRoute } from "@/lib/data/types"

interface RouteStopsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: TransportRoute | null
}

export function RouteStopsSheet({ open, onOpenChange, route }: RouteStopsSheetProps) {
  const stops = route ? [...route.stops].sort((a, b) => a.sequence - b.sequence) : []

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
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            <MapPinIcon className="mx-auto size-6" />
            <p className="font-medium text-foreground">Live GPS tracking not available</p>
            <p>
              This is a mock demo — route maps and real-time vehicle location aren&apos;t wired up
              here. In production this panel would show a live map of the bus along its stops.
            </p>
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
