"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/shared/logo"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { ROLES, ROLE_LABELS, type Role } from "@/lib/rbac/types"

export default function RegisterPage() {
  const router = useRouter()
  const { loginAs } = useCurrentUser()
  const [role, setRole] = useState<Role>("teacher")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    loginAs(role)
    toast.success("Account created", {
      description: `Welcome to MyCampus360 as a ${ROLE_LABELS[role]}.`,
    })
    router.push("/dashboard")
  }

  return (
    <div className="grid w-full max-w-4xl overflow-hidden rounded-xl ring-1 ring-foreground/10 md:grid-cols-2">
      <div className="hidden flex-col justify-between gap-6 bg-primary p-8 text-primary-foreground md:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Logo size={44} />
          MyCampus360
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-balance">
            One platform for every department, every stakeholder.
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Academics, attendance, fees, admissions, and administration — all in one real-time
            dashboard.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xl font-semibold">11</div>
            <div className="text-primary-foreground/70">User roles</div>
          </div>
          <div>
            <div className="text-xl font-semibold">20+</div>
            <div className="text-primary-foreground/70">Modules</div>
          </div>
          <div>
            <div className="text-xl font-semibold">100%</div>
            <div className="text-primary-foreground/70">Real-time</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 bg-popover p-8">
        <div>
          <h1 className="text-xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Set up your MyCampus360 account to get started.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <Input id="firstName" placeholder="Jane" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <Input id="lastName" placeholder="Doe" required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="reg-email">Email address</FieldLabel>
              <Input id="reg-email" type="email" placeholder="you@mycampus360.edu" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-phone">Phone</FieldLabel>
              <Input id="reg-phone" type="tel" placeholder="+91 98765 43210" />
            </Field>
            <Field>
              <FieldLabel htmlFor="reg-role">Role</FieldLabel>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="reg-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Demo only — normally assigned by an administrator.</FieldDescription>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                <Input id="reg-password" type="password" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-confirm">Confirm password</FieldLabel>
                <Input id="reg-confirm" type="password" required />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Checkbox id="terms" required />
              <FieldContent>
                <FieldLabel htmlFor="terms" className="font-normal">
                  I agree to the Terms of Service and Privacy Policy
                </FieldLabel>
              </FieldContent>
            </Field>
            <Button type="submit" className="w-full">
              Create account
            </Button>
            <FieldSeparator>Or continue with</FieldSeparator>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" type="button" disabled>
                Google
              </Button>
              <Button variant="outline" type="button" disabled>
                Microsoft
              </Button>
            </div>
            <FieldDescription className="text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
