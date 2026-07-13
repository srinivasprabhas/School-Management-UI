"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { useClassSections } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { Student } from "@/lib/data/types"

interface StudentFormValues {
  firstName: string
  lastName: string
  dob: string
  gender: Student["gender"]
  bloodGroup: string
  classSectionId: string
  rollNo: string
  admissionDate: string
  phone: string
  email: string
  addressLine1: string
  city: string
  state: string
  pincode: string
  fatherName: string
  fatherPhone: string
  fatherOccupation: string
  motherName: string
  motherPhone: string
  motherOccupation: string
  allergies: string
  doctorName: string
  doctorPhone: string
}

const EMPTY_FORM: StudentFormValues = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "male",
  bloodGroup: "O+",
  classSectionId: "",
  rollNo: "",
  admissionDate: new Date().toISOString().slice(0, 10),
  phone: "",
  email: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
  fatherName: "",
  fatherPhone: "",
  fatherOccupation: "",
  motherName: "",
  motherPhone: "",
  motherOccupation: "",
  allergies: "",
  doctorName: "",
  doctorPhone: "",
}

function studentToForm(s: Student): StudentFormValues {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    dob: s.dob,
    gender: s.gender,
    bloodGroup: s.bloodGroup,
    classSectionId: s.classSectionId,
    rollNo: String(s.rollNo),
    admissionDate: s.admissionDate,
    phone: s.phone,
    email: s.email,
    addressLine1: s.address.line1,
    city: s.address.city,
    state: s.address.state,
    pincode: s.address.pincode,
    fatherName: s.father.name,
    fatherPhone: s.father.phone,
    fatherOccupation: s.father.occupation ?? "",
    motherName: s.mother.name,
    motherPhone: s.mother.phone,
    motherOccupation: s.mother.occupation ?? "",
    allergies: s.medical.allergies.join(", "),
    doctorName: s.medical.doctorName,
    doctorPhone: s.medical.doctorPhone,
  }
}

interface StudentFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student
  onSubmit: (student: Student) => void
}

export function StudentFormSheet({ open, onOpenChange, student, onSubmit }: StudentFormSheetProps) {
  const { items: classSections } = useClassSections()
  const logActivity = useLogActivity()
  const [values, setValues] = useState<StudentFormValues>(EMPTY_FORM)
  const [medicalOpen, setMedicalOpen] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(student ? studentToForm(student) : EMPTY_FORM)
    }
  }, [open, student])

  function set<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.classSectionId) {
      toast.error("Please select a class and section.")
      return
    }
    setPending(true)

    const base = student
    const result: Student = {
      id: base?.id ?? `stu_new_${Date.now()}`,
      admissionNo: base?.admissionNo ?? `ADM2026${Math.floor(Math.random() * 900 + 100)}`,
      firstName: values.firstName,
      lastName: values.lastName,
      photoUrl: base?.photoUrl,
      dob: values.dob,
      gender: values.gender,
      bloodGroup: values.bloodGroup,
      classSectionId: values.classSectionId,
      rollNo: Number(values.rollNo) || 1,
      admissionDate: values.admissionDate,
      status: base?.status ?? "active",
      address: {
        line1: values.addressLine1,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
      phone: values.phone,
      email: values.email,
      father: { name: values.fatherName, phone: values.fatherPhone, occupation: values.fatherOccupation },
      mother: { name: values.motherName, phone: values.motherPhone, occupation: values.motherOccupation },
      guardian: base?.guardian,
      emergencyContact: base?.emergencyContact ?? values.fatherPhone,
      medical: {
        allergies: values.allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        chronicConditions: base?.medical.chronicConditions ?? [],
        medications: base?.medical.medications ?? [],
        doctorName: values.doctorName,
        doctorPhone: values.doctorPhone,
        lastCheckupDate: base?.medical.lastCheckupDate ?? values.admissionDate,
        vaccinationStatus: base?.medical.vaccinationStatus ?? "complete",
        heightCm: base?.medical.heightCm ?? 120,
        weightKg: base?.medical.weightKg ?? 25,
      },
      documents: base?.documents ?? [],
      previousSchool: base?.previousSchool,
      house: base?.house,
      busRouteId: base?.busRouteId,
    }

    setTimeout(() => {
      onSubmit(result)
      logActivity({
        action: base ? "update" : "create",
        module: "Students",
        entityType: "Student",
        entityId: result.id,
        description: `${base ? "Updated" : "Added"} student ${result.firstName} ${result.lastName}`,
      })
      toast.success(base ? "Student updated" : "Student added", {
        description: `${result.firstName} ${result.lastName} — ${result.admissionNo}`,
      })
      setPending(false)
      onOpenChange(false)
    }, 300)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{student ? "Edit Student" : "Add Student"}</SheetTitle>
          <SheetDescription>
            {student ? "Update this student's record." : "Enter the new student's details below."}
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
                  <Select value={values.gender} onValueChange={(v) => set("gender", v as Student["gender"])}>
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
                <FieldLabel htmlFor="bloodGroup">Blood group</FieldLabel>
                <Input id="bloodGroup" value={values.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} className="w-24" />
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Academic Details</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="classSection">Class & Section</FieldLabel>
                  <Select value={values.classSectionId} onValueChange={(v) => set("classSectionId", v ?? "")}>
                    <SelectTrigger id="classSection" className="w-full">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classSections.map((cs) => (
                        <SelectItem key={cs.id} value={cs.id}>
                          {cs.className} — {cs.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="rollNo">Roll No.</FieldLabel>
                  <Input id="rollNo" type="number" min={1} value={values.rollNo} onChange={(e) => set("rollNo", e.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="admissionDate">Admission date</FieldLabel>
                <Input id="admissionDate" type="date" required value={values.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Parent / Guardian</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="fatherName">Father&apos;s name</FieldLabel>
                  <Input id="fatherName" value={values.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="fatherPhone">Father&apos;s phone</FieldLabel>
                  <Input id="fatherPhone" value={values.fatherPhone} onChange={(e) => set("fatherPhone", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="motherName">Mother&apos;s name</FieldLabel>
                  <Input id="motherName" value={values.motherName} onChange={(e) => set("motherName", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="motherPhone">Mother&apos;s phone</FieldLabel>
                  <Input id="motherPhone" value={values.motherPhone} onChange={(e) => set("motherPhone", e.target.value)} />
                </Field>
              </div>
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

            <Collapsible open={medicalOpen} onOpenChange={setMedicalOpen}>
              <CollapsibleTrigger
                render={<Button type="button" variant="ghost" className="w-full justify-between px-0" />}
              >
                <span className="font-medium">Medical Information (optional)</span>
                <ChevronDownIcon
                  className={medicalOpen ? "rotate-180 transition-transform" : "transition-transform"}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <FieldGroup className="pt-4">
                  <Field>
                    <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
                    <Input
                      id="allergies"
                      placeholder="Peanuts, Dust, …"
                      value={values.allergies}
                      onChange={(e) => set("allergies", e.target.value)}
                    />
                    <FieldDescription>Comma-separated list.</FieldDescription>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="doctorName">Doctor name</FieldLabel>
                      <Input id="doctorName" value={values.doctorName} onChange={(e) => set("doctorName", e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="doctorPhone">Doctor phone</FieldLabel>
                      <Input id="doctorPhone" value={values.doctorPhone} onChange={(e) => set("doctorPhone", e.target.value)} />
                    </Field>
                  </div>
                </FieldGroup>
              </CollapsibleContent>
            </Collapsible>
          </FieldGroup>

          <SheetFooter className="flex-row justify-end gap-2 p-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {student ? "Save Changes" : "Add Student"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
