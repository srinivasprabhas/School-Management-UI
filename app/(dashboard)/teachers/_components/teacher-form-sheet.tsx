"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useSubjects } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { DEPARTMENTS, DESIGNATIONS } from "@/lib/data/seed/pools"
import type { Teacher } from "@/lib/data/types"

const PAY_GRADES = ["L1", "L2", "L3", "L4"]

interface TeacherFormValues {
  firstName: string
  lastName: string
  dob: string
  gender: Teacher["gender"]
  employeeId: string
  designation: string
  department: string
  qualifications: string
  experienceYears: string
  joinDate: string
  subjectIds: string[]
  phone: string
  email: string
  emergencyContact: string
  addressLine1: string
  city: string
  state: string
  pincode: string
  basic: string
  payGrade: string
}

function generateEmployeeId(): string {
  return `EMP${Math.floor(Math.random() * 9000 + 1000)}`
}

const EMPTY_FORM: TeacherFormValues = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "male",
  employeeId: "",
  designation: "",
  department: "",
  qualifications: "",
  experienceYears: "",
  joinDate: new Date().toISOString().slice(0, 10),
  subjectIds: [],
  phone: "",
  email: "",
  emergencyContact: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
  basic: "",
  payGrade: "L1",
}

function teacherToForm(t: Teacher): TeacherFormValues {
  return {
    firstName: t.firstName,
    lastName: t.lastName,
    dob: t.dob,
    gender: t.gender,
    employeeId: t.employeeId,
    designation: t.designation,
    department: t.department,
    qualifications: t.qualifications.join(", "),
    experienceYears: String(t.experienceYears),
    joinDate: t.joinDate,
    subjectIds: t.subjectIds,
    phone: t.phone,
    email: t.email,
    emergencyContact: t.emergencyContact,
    addressLine1: t.address.line1,
    city: t.address.city,
    state: t.address.state,
    pincode: t.address.pincode,
    basic: String(t.salary.basic),
    payGrade: t.salary.payGrade,
  }
}

interface TeacherFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher?: Teacher
  onSubmit: (teacher: Teacher) => void
}

export function TeacherFormSheet({ open, onOpenChange, teacher, onSubmit }: TeacherFormSheetProps) {
  const { items: subjects } = useSubjects()
  const logActivity = useLogActivity()
  const [values, setValues] = useState<TeacherFormValues>(EMPTY_FORM)
  const [pending, setPending] = useState(false)
  const subjectsAnchorRef = useComboboxAnchor()

  useEffect(() => {
    if (open) {
      setValues(teacher ? teacherToForm(teacher) : { ...EMPTY_FORM, employeeId: generateEmployeeId() })
    }
  }, [open, teacher])

  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const subjectIdOptions = useMemo(() => subjects.map((s) => s.id), [subjects])

  function set<K extends keyof TeacherFormValues>(key: K, value: TeacherFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.designation || !values.department) {
      toast.error("Please select a designation and department.")
      return
    }
    setPending(true)

    const base = teacher
    const basic = Number(values.basic) || 0
    const allowances = base?.salary.allowances ?? Math.round(basic * 0.3)
    const deductions = base?.salary.deductions ?? Math.round(basic * 0.08)

    const result: Teacher = {
      id: base?.id ?? `tch_new_${Date.now()}`,
      employeeId: values.employeeId,
      firstName: values.firstName,
      lastName: values.lastName,
      photoUrl: base?.photoUrl,
      dob: values.dob,
      gender: values.gender,
      joinDate: values.joinDate,
      designation: values.designation,
      department: values.department,
      qualifications: values.qualifications
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean),
      experienceYears: Number(values.experienceYears) || 0,
      subjectIds: values.subjectIds,
      assignedClasses: base?.assignedClasses ?? [],
      address: {
        line1: values.addressLine1,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
      phone: values.phone,
      email: values.email,
      emergencyContact: values.emergencyContact,
      salary: {
        basic,
        allowances,
        deductions,
        netSalary: basic + allowances - deductions,
        bankAccountMasked: base?.salary.bankAccountMasked ?? `XXXX XXXX ${Math.floor(Math.random() * 9000 + 1000)}`,
        payGrade: values.payGrade,
        lastPaidDate: base?.salary.lastPaidDate ?? values.joinDate,
      },
      leaveHistory: base?.leaveHistory ?? [],
      leaveBalance: base?.leaveBalance ?? 12,
      documents: base?.documents ?? [],
      status: base?.status ?? "active",
    }

    setTimeout(() => {
      onSubmit(result)
      logActivity({
        action: base ? "update" : "create",
        module: "Teachers",
        entityType: "Teacher",
        entityId: result.id,
        description: `${base ? "Updated" : "Added"} teacher ${result.firstName} ${result.lastName}`,
      })
      toast.success(base ? "Teacher updated" : "Teacher added", {
        description: `${result.firstName} ${result.lastName} — ${result.employeeId}`,
      })
      setPending(false)
      onOpenChange(false)
    }, 300)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{teacher ? "Edit Teacher" : "Add Teacher"}</SheetTitle>
          <SheetDescription>
            {teacher ? "Update this teacher record." : "Enter the new teacher details below."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between gap-6 px-4 pb-4">
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Basic Information</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input id="firstName" required value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input id="lastName" required value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
                  <Input id="dob" type="date" required value={values.dob} onChange={(e) => set("dob", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Select value={values.gender} onValueChange={(v) => set("gender", v as Teacher["gender"])}>
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="employeeId">Employee ID</FieldLabel>
                <Input id="employeeId" readOnly disabled value={values.employeeId} className="w-40" />
                <FieldDescription>Auto-generated and cannot be edited.</FieldDescription>
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Professional Details</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="designation">Designation</FieldLabel>
                  <Select value={values.designation} onValueChange={(v) => set("designation", v ?? "")}>
                    <SelectTrigger id="designation" className="w-full">
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGNATIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="department">Department</FieldLabel>
                  <Select value={values.department} onValueChange={(v) => set("department", v ?? "")}>
                    <SelectTrigger id="department" className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="qualifications">Qualifications</FieldLabel>
                <Input
                  id="qualifications"
                  placeholder="B.Ed, M.Sc, …"
                  value={values.qualifications}
                  onChange={(e) => set("qualifications", e.target.value)}
                />
                <FieldDescription>Comma-separated list.</FieldDescription>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="experienceYears">Experience (years)</FieldLabel>
                  <Input
                    id="experienceYears"
                    type="number"
                    min={0}
                    value={values.experienceYears}
                    onChange={(e) => set("experienceYears", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="joinDate">Join date</FieldLabel>
                  <Input id="joinDate" type="date" required value={values.joinDate} onChange={(e) => set("joinDate", e.target.value)} />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Subjects</FieldLegend>
              <Field>
                <FieldLabel htmlFor="subjects">Subjects taught</FieldLabel>
                <Combobox<string, true>
                  items={subjectIdOptions}
                  multiple
                  value={values.subjectIds}
                  onValueChange={(v) => set("subjectIds", v)}
                  itemToStringLabel={(id) => subjectsById.get(id)?.name ?? id}
                >
                  <ComboboxChips ref={subjectsAnchorRef}>
                    {values.subjectIds.map((id) => (
                      <ComboboxChip key={id}>{subjectsById.get(id)?.name ?? id}</ComboboxChip>
                    ))}
                    <ComboboxChipsInput
                      id="subjects"
                      placeholder={values.subjectIds.length ? "" : "Select subjects…"}
                    />
                  </ComboboxChips>
                  <ComboboxContent anchor={subjectsAnchorRef}>
                    <ComboboxEmpty>No subjects found.</ComboboxEmpty>
                    <ComboboxList>
                      <ComboboxCollection>
                        {(id: string) => (
                          <ComboboxItem key={id} value={id}>
                            {subjectsById.get(id)?.name ?? id}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldDescription>Select all subjects this teacher can teach.</FieldDescription>
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Contact & Address</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input id="phone" required value={values.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="emergencyContact">Emergency contact</FieldLabel>
                <Input
                  id="emergencyContact"
                  value={values.emergencyContact}
                  onChange={(e) => set("emergencyContact", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="addressLine1">Address</FieldLabel>
                <Input id="addressLine1" value={values.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="state">State</FieldLabel>
                  <Input id="state" value={values.state} onChange={(e) => set("state", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
                  <Input id="pincode" value={values.pincode} onChange={(e) => set("pincode", e.target.value)} />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Salary</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="basic">Basic pay</FieldLabel>
                  <Input id="basic" type="number" min={0} value={values.basic} onChange={(e) => set("basic", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="payGrade">Pay grade</FieldLabel>
                  <Select value={values.payGrade} onValueChange={(v) => set("payGrade", v ?? "L1")}>
                    <SelectTrigger id="payGrade" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldSet>
          </FieldGroup>

          <SheetFooter className="flex-row justify-end gap-2 p-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {teacher ? "Save Changes" : "Add Teacher"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
