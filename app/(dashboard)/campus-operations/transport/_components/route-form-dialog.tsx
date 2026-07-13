"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useLogActivity } from "@/lib/data/audit"
import { useVehicles } from "@/lib/data/store/entities"
import type { RouteStop, TransportRoute } from "@/lib/data/types"

interface StopDraft {
  key: string
  name: string
  sequence: string
  pickupTime: string
  dropTime: string
  studentsCount: string
}

function emptyStop(sequence: number): StopDraft {
  return {
    key: `stop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    sequence: String(sequence),
    pickupTime: "07:30",
    dropTime: "15:30",
    studentsCount: "0",
  }
}

interface RouteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (route: TransportRoute) => void
}

export function RouteFormDialog({ open, onOpenChange, onSubmit }: RouteFormDialogProps) {
  const { items: vehicles } = useVehicles()
  const logActivity = useLogActivity()

  const [name, setName] = useState("")
  const [vehicleId, setVehicleId] = useState<string>("")
  const [distance, setDistance] = useState("10")
  const [stops, setStops] = useState<StopDraft[]>([emptyStop(1)])
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setName("")
      setVehicleId("")
      setDistance("10")
      setStops([emptyStop(1)])
    }
  }, [open])

  function updateStop(key: string, patch: Partial<StopDraft>) {
    setStops((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }

  function addStop() {
    setStops((prev) => [...prev, emptyStop(prev.length + 1)])
  }

  function removeStop(key: string) {
    setStops((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a route name.")
      return
    }
    setPending(true)

    const routeStops: RouteStop[] = stops
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name,
        sequence: Number(s.sequence) || 1,
        pickupTime: s.pickupTime,
        dropTime: s.dropTime,
        studentsCount: Number(s.studentsCount) || 0,
      }))
      .sort((a, b) => a.sequence - b.sequence)

    const result: TransportRoute = {
      id: `rt_new_${Date.now()}`,
      name,
      vehicleId: vehicleId || undefined,
      stops: routeStops,
      totalDistanceKm: Number(distance) || 0,
      status: "active",
    }

    setTimeout(() => {
      onSubmit(result)
      logActivity({
        action: "create",
        module: "Transport",
        entityType: "TransportRoute",
        entityId: result.id,
        description: `Added route ${result.name}`,
      })
      toast.success("Route added", { description: result.name })
      setPending(false)
      onOpenChange(false)
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] scrollbar-thin overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Route</DialogTitle>
          <DialogDescription>Define a new bus route and its stops.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <FieldSet>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="routeName">Route name</FieldLabel>
                  <Input id="routeName" required value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="routeVehicle">Assigned vehicle</FieldLabel>
                  <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                    <SelectTrigger id="routeVehicle" className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.regNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="routeDistance">Total distance (km)</FieldLabel>
                <Input
                  id="routeDistance"
                  type="number"
                  min={0}
                  className="w-32"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend variant="label">Stops</FieldLegend>
              <div className="flex flex-col gap-3">
                {stops.map((stop, idx) => (
                  <div key={stop.key} className="grid grid-cols-12 items-end gap-2 rounded-md border p-2">
                    <div className="col-span-4">
                      <FieldLabel className="text-xs">Stop name</FieldLabel>
                      <Input
                        placeholder={`Stop ${idx + 1}`}
                        value={stop.name}
                        onChange={(e) => updateStop(stop.key, { name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel className="text-xs">Seq.</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        value={stop.sequence}
                        onChange={(e) => updateStop(stop.key, { sequence: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel className="text-xs">Pickup</FieldLabel>
                      <Input
                        type="time"
                        value={stop.pickupTime}
                        onChange={(e) => updateStop(stop.key, { pickupTime: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel className="text-xs">Drop</FieldLabel>
                      <Input
                        type="time"
                        value={stop.dropTime}
                        onChange={(e) => updateStop(stop.key, { dropTime: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1">
                      <FieldLabel className="text-xs">Students</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={stop.studentsCount}
                        onChange={(e) => updateStop(stop.key, { studentsCount: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={stops.length === 1}
                        onClick={() => removeStop(stop.key)}
                      >
                        <Trash2Icon />
                        <span className="sr-only">Remove stop</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addStop}>
                <PlusIcon data-icon="inline-start" />
                Add Stop
              </Button>
            </FieldSet>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Add Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
