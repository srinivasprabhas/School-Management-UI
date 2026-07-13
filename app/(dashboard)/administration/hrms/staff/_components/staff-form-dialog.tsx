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
import type { StaffMember } from "@/lib/data/types"

interface StaffFormValues {
  name: string
  employeeId: string
  designation: string
  department: string
  joinDate: string
  phone: string
  email: string
  employmentType: StaffMember["employmentType"]
}

const EMPTY_FORM: StaffFormValues = {
  name: "",
  employeeId: "",
  designation: "",
  department: "",
  joinDate: new Date().toISOString().slice(0, 10),
  phone: "",
  email: "",
  employmentType: "full_time",
}

function staffToForm(s: StaffMember): StaffFormValues {
  return {
    name: s.name,
    employeeId: s.employeeId,
    designation: s.designation,
    department: s.department,
    joinDate: s.joinDate,
    phone: s.phone,
    email: s.email,
    employmentType: s.employmentType,
  }
}

interface StaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: StaffMember
  onSubmit: (staff: StaffMember) => void
}

export function StaffFormDialog({ open, onOpenChange, staff, onSubmit }: StaffFormDialogProps) {
  const logActivity = useLogActivity()
  const [values, setValues] = useState<StaffFormValues>(EMPTY_FORM)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(staff ? staffToForm(staff) : EMPTY_FORM)
    }
  }, [open, staff])

  function set<K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)

    const base = staff
    const result: StaffMember = {
      id: base?.id ?? `stf_new_${Date.now()}`,
      name: values.name,
      photoUrl: base?.photoUrl,
      employeeId: values.employeeId,
      designation: values.designation,
      department: values.department,
      joinDate: values.joinDate,
      phone: values.phone,
      email: values.email,
      employmentType: values.employmentType,
      status: base?.status ?? "active",
      reportingManager: base?.reportingManager,
    }

    setTimeout(() => {
      onSubmit(result)
      logActivity({
        action: base ? "update" : "create",
        module: "HRMS",
        entityType: "StaffMember",
        entityId: result.id,
        description: `${base ? "Updated" : "Added"} staff member ${result.name}`,
      })
      toast.success(base ? "Staff updated" : "Staff added", {
        description: `${result.name} — ${result.employeeId}`,
      })
      setPending(false)
      onOpenChange(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staff" : "Add Staff"}</DialogTitle>
          <DialogDescription>
            {staff ? "Update this staff member's details." : "Enter the new staff member's details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="staffName">Name</FieldLabel>
                <Input id="staffName" required value={values.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="staffEmployeeId">Employee ID</FieldLabel>
                <Input
                  id="staffEmployeeId"
                  required
                  value={values.employeeId}
                  onChange={(e) => set("employeeId", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="staffDesignation">Designation</FieldLabel>
                <Input
                  id="staffDesignation"
                  required
                  value={values.designation}
                  onChange={(e) => set("designation", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="staffDepartment">Department</FieldLabel>
                <Input
                  id="staffDepartment"
                  required
                  value={values.department}
                  onChange={(e) => set("department", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="staffJoinDate">Join date</FieldLabel>
                <Input
                  id="staffJoinDate"
                  type="date"
                  required
                  value={values.joinDate}
                  onChange={(e) => set("joinDate", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="staffEmploymentType">Employment type</FieldLabel>
                <Select
                  value={values.employmentType}
                  onValueChange={(v) => set("employmentType", (v ?? "full_time") as StaffMember["employmentType"])}
                >
                  <SelectTrigger id="staffEmploymentType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="staffPhone">Phone</FieldLabel>
                <Input id="staffPhone" required value={values.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="staffEmail">Email</FieldLabel>
                <Input
                  id="staffEmail"
                  type="email"
                  required
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {staff ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
