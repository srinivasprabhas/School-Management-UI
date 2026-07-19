"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type { RouteLayout, SyntheticStatus } from "@/lib/transport/route-geometry"
import {
  deriveSyntheticStatus,
  getDepotPoint,
  getPointAtProgress,
  getRouteLayout,
  getVehicleTiming,
} from "@/lib/transport/route-geometry"
import type { TransportRoute, Vehicle } from "@/lib/data/types"

export interface BusPosition {
  x: number
  y: number
  headingDeg: number
  status: SyntheticStatus
}

interface UseBusSimulationArgs {
  vehicles: Vehicle[]
  routes: TransportRoute[]
  playing: boolean
  speed: number
}

const STATE_COMMIT_INTERVAL_MS = 50

function computePositions(
  vehicles: Vehicle[],
  routesById: Map<string, TransportRoute>,
  routeLayouts: Map<string, RouteLayout>,
  elapsedMs: number
): Map<string, BusPosition> {
  const next = new Map<string, BusPosition>()
  for (const vehicle of vehicles) {
    const route = vehicle.routeId ? routesById.get(vehicle.routeId) : undefined
    const status = deriveSyntheticStatus(vehicle, route)

    if (status !== "on-route" || !route) {
      const depot = getDepotPoint(vehicle)
      next.set(vehicle.id, { x: depot.x, y: depot.y, headingDeg: 0, status })
      continue
    }

    const layout = routeLayouts.get(route.id)
    if (!layout) continue
    const { loopDurationMs, phaseOffsetMs } = getVehicleTiming(vehicle, route)
    const t = (elapsedMs + phaseOffsetMs) / loopDurationMs
    const { x, y, headingDeg } = getPointAtProgress(layout, t)
    next.set(vehicle.id, { x, y, headingDeg, status })
  }
  return next
}

/**
 * Drives fully client-simulated "live" bus positions along each route's deterministic loop.
 * Uses requestAnimationFrame (auto-throttles when backgrounded, aligns to display refresh) and
 * commits React state at a throttled ~20fps — plenty for this app's slow, gentle bus motion,
 * with a CSS transition on the marker smoothing the gaps between commits. Initial (t=0)
 * positions are a pure function of vehicles/routes only (no Date.now()), so they're safe to
 * compute during render/in the useState initializer; only ticking forward happens in an effect.
 */
export function useBusSimulation({ vehicles, routes, playing, speed }: UseBusSimulationArgs) {
  const routesById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes])
  const routeLayouts = useMemo(() => {
    const map = new Map<string, RouteLayout>()
    routes.forEach((route, index) => map.set(route.id, getRouteLayout(route, index, routes.length)))
    return map
  }, [routes])

  const [positions, setPositions] = useState(() =>
    computePositions(vehicles, routesById, routeLayouts, 0)
  )

  const elapsedRef = useRef(0)
  const lastTimestampRef = useRef<number | null>(null)
  const lastCommitRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return

    function tick(timestamp: number) {
      if (lastTimestampRef.current === null) lastTimestampRef.current = timestamp
      const dt = timestamp - lastTimestampRef.current
      lastTimestampRef.current = timestamp
      elapsedRef.current += dt * speed

      if (timestamp - lastCommitRef.current >= STATE_COMMIT_INTERVAL_MS) {
        lastCommitRef.current = timestamp
        setPositions(computePositions(vehicles, routesById, routeLayouts, elapsedRef.current))
      }

      rafIdRef.current = requestAnimationFrame(tick)
    }

    function startLoop() {
      lastTimestampRef.current = null
      rafIdRef.current = requestAnimationFrame(tick)
    }

    function stopLoop() {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    function handleVisibilityChange() {
      if (document.hidden) stopLoop()
      else startLoop()
    }

    if (!document.hidden) startLoop()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stopLoop()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [playing, speed, vehicles, routesById, routeLayouts])

  return positions
}
