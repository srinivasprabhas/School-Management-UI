"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MailIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { MOCK_USERS } from "@/lib/rbac/mock-users"
import { ROLE_LABELS } from "@/lib/rbac/types"

export default function LoginPage() {
  const router = useRouter()
  const { loginAs } = useCurrentUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetSent, setResetSent] = useState(false)

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    const match = MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!match || !password) {
      toast.error("Invalid credentials", {
        description: "Use one of the demo accounts below, or pick a role to sign in instantly.",
      })
      return
    }
    loginAs(match.role)
    toast.success(`Signed in as ${match.name}`)
    router.push("/dashboard")
  }

  function handleDemoLogin(role: (typeof MOCK_USERS)[number]["role"]) {
    loginAs(role)
    const user = MOCK_USERS.find((u) => u.role === role)
    toast.success(`Signed in as ${user?.name}`, { description: ROLE_LABELS[role] })
    router.push("/dashboard")
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <Logo size={56} className="mx-auto mb-2" />
          <CardTitle className="text-xl">Sign in to MyCampus360</CardTitle>
          <CardDescription>Enter your email and password to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@mycampus360.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Dialog>
                    <DialogTrigger
                      render={
                        <button type="button" className="text-sm text-primary hover:underline" />
                      }
                    >
                      Forgot your password?
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset your password</DialogTitle>
                        <DialogDescription>
                          {resetSent
                            ? "Check your email for a link to reset your password."
                            : "Enter your email and we'll send you a reset link."}
                        </DialogDescription>
                      </DialogHeader>
                      {!resetSent ? (
                        <FieldGroup>
                          <Field>
                            <InputGroup>
                              <InputGroupInput type="email" placeholder="you@mycampus360.edu" />
                              <InputGroupAddon>
                                <MailIcon className="size-4" />
                              </InputGroupAddon>
                            </InputGroup>
                          </Field>
                          <Button type="button" onClick={() => setResetSent(true)}>
                            Send reset link
                          </Button>
                        </FieldGroup>
                      ) : null}
                    </DialogContent>
                  </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="remember" />
                <FieldContent>
                  <FieldLabel htmlFor="remember" className="font-normal">
                    Remember me
                  </FieldLabel>
                </FieldContent>
              </Field>
              <Button type="submit" className="w-full">
                Sign in
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
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo login</CardTitle>
          <CardDescription>
            No backend here — pick a role to instantly sign in and see role-based access in action.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOCK_USERS.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => handleDemoLogin(user.role)}
            >
              {ROLE_LABELS[user.role]}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
