"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { toISODate, addDays } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { Vehicle } from "@/lib/data/types"

interface VehicleFormValues {
  regNo: string
  type: Vehicle["type"]
  capacity: string
  driverName: string
  driverPhone: string
  driverLicenseNo: string
  fuelType: Vehicle["fuelType"]
  status: Vehicle["status"]
  lastServiceDate: string
  nextServiceDue: string
}

const EMPTY_FORM: VehicleFormValues = {
  regNo: "",
  type: "bus",
  capacity: "40",
  driverName: "",
  driverPhone: "",
  driverLicenseNo: "",
  fuelType: "diesel",
  status: "active",
  lastServiceDate: toISODate(SEED_TODAY),
  nextServiceDue: toISODate(addDays(SEED_TODAY, 90)),
}

function vehicleToForm(v: Vehicle): VehicleFormValues {
  return {
    regNo: v.regNo,
    type: v.type,
    capacity: String(v.capacity),
    driverName: v.driverName,
    driverPhone: v.driverPhone,
    driverLicenseNo: v.driverLicenseNo,
    fuelType: v.fuelType,
    status: v.status,
    lastServiceDate: v.lastServiceDate,
    nextServiceDue: v.nextServiceDue,
  }
}

interface VehicleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle
  onSubmit: (vehicle: Vehicle) => void
}

export function VehicleFormDialog({ open, onOpenChange, vehicle, onSubmit }: VehicleFormDialogProps) {
  const logActivity = useLogActivity()
  const [values, setValues] = useState<VehicleFormValues>(EMPTY_FORM)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(vehicle ? vehicleToForm(vehicle) : EMPTY_FORM)
    }
  }, [open, vehicle])

  function set<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.regNo.trim() || !values.driverName.trim()) {
      toast.error("Please fill in the registration number and driver name.")
      return
    }
    setPending(true)

    const base = vehicle
    const result: Vehicle = {
      id: base?.id ?? `veh_new_${Date.now()}`,
      regNo: values.regNo,
      type: values.type,
      capacity: Number(values.capacity) || 1,
      driverName: values.driverName,
      driverPhone: values.driverPhone,
      driverLicenseNo: values.driverLicenseNo,
      status: values.status,
      routeId: base?.routeId,
      lastServiceDate: values.lastServiceDate,
      nextServiceDue: values.nextServiceDue,
      fuelType: values.fuelType,
    }

    setTimeout(() => {
      onSubmit(result)
      logActivity({
        action: base ? "update" : "create",
        module: "Transport",
        entityType: "Vehicle",
        entityId: result.id,
        description: `${base ? "Updated" : "Added"} vehicle ${result.regNo}`,
      })
      toast.success(base ? "Vehicle updated" : "Vehicle added", { description: result.regNo })
      setPending(false)
      onOpenChange(false)
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Update this vehicle's details." : "Register a new vehicle to the fleet."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="regNo">Registration No.</FieldLabel>
                <Input id="regNo" required value={values.regNo} onChange={(e) => set("regNo", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select value={values.type} onValueChange={(v) => set("type", (v ?? "bus") as Vehicle["type"])}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                <Input id="capacity" type="number" min={1} value={values.capacity} onChange={(e) => set("capacity", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuelType">Fuel Type</FieldLabel>
                <Select value={values.fuelType} onValueChange={(v) => set("fuelType", (v ?? "diesel") as Vehicle["fuelType"])}>
                  <SelectTrigger id="fuelType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="driverName">Driver name</FieldLabel>
                <Input id="driverName" required value={values.driverName} onChange={(e) => set("driverName", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="driverPhone">Driver phone</FieldLabel>
                <Input id="driverPhone" value={values.driverPhone} onChange={(e) => set("driverPhone", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="driverLicenseNo">Driver license No.</FieldLabel>
              <Input id="driverLicenseNo" value={values.driverLicenseNo} onChange={(e) => set("driverLicenseNo", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="lastServiceDate">Last service date</FieldLabel>
                <Input id="lastServiceDate" type="date" value={values.lastServiceDate} onChange={(e) => set("lastServiceDate", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="nextServiceDue">Next service due</FieldLabel>
                <Input id="nextServiceDue" type="date" value={values.nextServiceDue} onChange={(e) => set("nextServiceDue", e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Select value={values.status} onValueChange={(v) => set("status", (v ?? "active") as Vehicle["status"])}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {vehicle ? "Save Changes" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
