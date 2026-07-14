"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UploadIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/page-header"
import { useSchoolProfile } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { initials } from "@/lib/format"
import type { SchoolProfile } from "@/lib/data/types"

export default function SchoolSettingsPage() {
  const { value: profile, set, isHydrated } = useSchoolProfile()
  const logActivity = useLogActivity()
  const [values, setValues] = useState<SchoolProfile>(profile)

  useEffect(() => {
    if (isHydrated) setValues(profile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated])

  function set_<K extends keyof SchoolProfile>(key: K, value: SchoolProfile[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    set(values)
    logActivity({
      action: "update",
      module: "Settings",
      entityType: "SchoolProfile",
      description: `Updated school profile for ${values.name}`,
    })
    toast.success("School profile saved")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="School Settings" description="School profile settings." />
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FieldGroup>
              <FieldSet>
                <div className="flex items-center gap-4">
                  <Avatar size="lg" className="size-16">
                    <AvatarFallback className="text-lg">{initials(values.name || "School")}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" disabled>
                    <UploadIcon data-icon="inline-start" />
                    Upload Logo
                  </Button>
                </div>
                <Field>
                  <FieldLabel htmlFor="name">School name</FieldLabel>
                  <Input id="name" required value={values.name} onChange={(e) => set_("name", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Textarea id="address" required value={values.address} onChange={(e) => set_("address", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input id="phone" required value={values.phone} onChange={(e) => set_("phone", e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" required value={values.email} onChange={(e) => set_("email", e.target.value)} />
                  </Field>
                </div>
              </FieldSet>

              <FieldSeparator />

              <FieldSet>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="code">School code</FieldLabel>
                    <Input id="code" required value={values.code} onChange={(e) => set_("code", e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="establishedYear">Established year</FieldLabel>
                    <Input
                      id="establishedYear"
                      type="number"
                      required
                      value={values.establishedYear}
                      onChange={(e) => set_("establishedYear", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="principalName">Principal name</FieldLabel>
                    <Input
                      id="principalName"
                      required
                      value={values.principalName}
                      onChange={(e) => set_("principalName", e.target.value)}
                    />
                  </Field>
                </div>
              </FieldSet>
            </FieldGroup>

            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
