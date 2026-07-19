import type { StatusTone } from "@/components/shared/status-badge"
import type { RouteStop, TransportRoute, Vehicle } from "@/lib/data/types"

export const MAP_WIDTH = 1000
export const MAP_HEIGHT = 620
export const CAMPUS = { x: MAP_WIDTH / 2, y: 330 }

export type SyntheticStatus = "on-route" | "idle" | "out-of-service"

export const SYNTHETIC_STATUS_LABEL: Record<SyntheticStatus, string> = {
  "on-route": "On route",
  idle: "Idle",
  "out-of-service": "Out of service",
}

export const SYNTHETIC_STATUS_TONE: Record<SyntheticStatus, StatusTone> = {
  "on-route": "success",
  idle: "warning",
  "out-of-service": "destructive",
}

interface Point {
  x: number
  y: number
}

export interface RouteLayout {
  waypoints: Point[]
  stopPoints: { stop: RouteStop; point: Point }[]
  cumulativeLengths: number[]
  totalLength: number
}

export interface VehicleTiming {
  loopDurationMs: number
  phaseOffsetMs: number
}

/** Deterministic 32-bit string hash (FNV-1a) — independent of the app's seeded PRNG, used only
 * to derive stable presentation-layer geometry/timing from entity ids, never persisted. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function hashRange(seed: string, min: number, max: number): number {
  return min + (hashString(seed) % (max - min + 1))
}

function hashUnit(seed: string): number {
  return (hashString(seed) % 10000) / 10000
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Pure, deterministic per-route layout — same route always produces the same fan-out sector,
 * stop positions, and connecting path. Routes are evenly angularly partitioned around the
 * campus hub (guaranteeing no sector overlap) with small per-route jitter/bend for variety, and
 * fan further out the longer `totalDistanceKm` is, so the abstract diagram still reflects real
 * seeded data rather than being pure noise.
 */
export function getRouteLayout(route: TransportRoute, routeIndex: number, routeCount: number): RouteLayout {
  const count = Math.max(routeCount, 1)
  const baseAngle = (routeIndex / count) * 360
  const jitter = hashRange(`${route.id}:jitter`, -10, 10)
  const angle = baseAngle + jitter
  const sectorHalfWidth = 0.42 * (360 / count)
  const bendSign = hashString(`${route.id}:bend`) % 2 === 0 ? 1 : -1
  const bend = bendSign * sectorHalfWidth * 0.5

  const distanceT = Math.min(Math.max((route.totalDistanceKm - 8) / (25 - 8), 0), 1)
  const outerRadius = 200 + distanceT * 80

  const stops = [...route.stops].sort((a, b) => a.sequence - b.sequence)
  const n = stops.length

  const stopPoints = stops.map((stop, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1)
    const radius = 90 + t * (outerRadius - 90)
    const stopAngle = angle + Math.sin(t * Math.PI) * bend
    const rad = (stopAngle * Math.PI) / 180
    const point: Point = {
      x: CAMPUS.x + radius * Math.cos(rad),
      y: CAMPUS.y + radius * Math.sin(rad) * 0.72,
    }
    return { stop, point }
  })

  const waypoints: Point[] = [CAMPUS, ...stopPoints.map((s) => s.point), CAMPUS]

  const cumulativeLengths: number[] = [0]
  for (let i = 1; i < waypoints.length; i++) {
    cumulativeLengths.push(cumulativeLengths[i - 1] + distance(waypoints[i - 1], waypoints[i]))
  }
  const totalLength = cumulativeLengths[cumulativeLengths.length - 1] || 1

  return { waypoints, stopPoints, cumulativeLengths, totalLength }
}

/** Arc-length interpolation along a route's closed campus-to-campus loop; `t` wraps to [0, 1). */
export function getPointAtProgress(layout: RouteLayout, t: number): Point & { headingDeg: number } {
  const loopT = ((t % 1) + 1) % 1
  const targetLength = loopT * layout.totalLength
  const { waypoints, cumulativeLengths } = layout

  let segmentIndex = cumulativeLengths.length - 2
  for (let i = 0; i < cumulativeLengths.length - 1; i++) {
    if (targetLength <= cumulativeLengths[i + 1]) {
      segmentIndex = i
      break
    }
  }

  const segStart = waypoints[segmentIndex]
  const segEnd = waypoints[segmentIndex + 1]
  const segLength = cumulativeLengths[segmentIndex + 1] - cumulativeLengths[segmentIndex]
  const segT = segLength > 0 ? (targetLength - cumulativeLengths[segmentIndex]) / segLength : 0

  return {
    x: segStart.x + (segEnd.x - segStart.x) * segT,
    y: segStart.y + (segEnd.y - segStart.y) * segT,
    headingDeg: (Math.atan2(segEnd.y - segStart.y, segEnd.x - segStart.x) * 180) / Math.PI,
  }
}

/**
 * Per-vehicle loop speed and start-phase, both hash-derived from the vehicle id, so no two
 * buses complete a loop in the same time or start at the same point along it — the fleet
 * visibly drifts out of sync instead of moving in lockstep.
 */
export function getVehicleTiming(vehicle: Vehicle, route: TransportRoute | undefined): VehicleTiming {
  const perVehicleFactor = 0.85 + (hashString(`${vehicle.id}:speed`) % 31) / 100
  const distanceKm = route?.totalDistanceKm ?? 16
  const loopDurationMs = 22000 * (distanceKm / 16) * perVehicleFactor
  const phaseOffsetMs = hashUnit(`${vehicle.id}:phase`) * loopDurationMs
  return { loopDurationMs, phaseOffsetMs }
}

/** Deterministic small offset near campus for idle/out-of-service vehicles, so they don't stack. */
export function getDepotPoint(vehicle: Vehicle): Point {
  const angle = hashRange(`${vehicle.id}:depot`, 0, 359)
  const radius = 40 + (hashString(`${vehicle.id}:depot-r`) % 20)
  const rad = (angle * Math.PI) / 180
  return {
    x: CAMPUS.x + radius * Math.cos(rad),
    y: CAMPUS.y + radius * Math.sin(rad) * 0.72,
  }
}

export function deriveSyntheticStatus(vehicle: Vehicle, route: TransportRoute | undefined): SyntheticStatus {
  if (vehicle.status !== "active") return "out-of-service"
  if (route && route.stops.length > 0) return "on-route"
  return "idle"
}
