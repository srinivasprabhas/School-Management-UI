"use client"

import { useState } from "react"
import { toast } from "sonner"
import { HistoryIcon, LaptopIcon, MonitorSmartphoneIcon, ShieldIcon, SmartphoneIcon, UploadIcon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { ROLE_LABELS } from "@/lib/rbac/types"
import { useAuditLog } from "@/lib/data/store/entities"
import { formatDate, initials } from "@/lib/format"
import type { AuditLogEntry } from "@/lib/data/types"

interface SessionRow {
  id: string
  device: string
  browser: string
  ip: string
  lastActive: string
}

const DEFAULT_SESSIONS: SessionRow[] = [
  { id: "sess_1", device: "Windows 11 · Desktop", browser: "Chrome 126", ip: "203.0.113.24", lastActive: "Active now" },
  { id: "sess_2", device: "iPhone 15", browser: "Safari Mobile", ip: "203.0.113.87", lastActive: "2 hours ago" },
  { id: "sess_3", device: "MacBook Pro", browser: "Chrome 126", ip: "198.51.100.14", lastActive: "Yesterday" },
]

interface NotifPref {
  key: string
  label: string
  inApp: boolean
  email: boolean
}

const DEFAULT_MY_PREFS: NotifPref[] = [
  { key: "fee_due", label: "Fee due reminders", inApp: true, email: true },
  { key: "birthday", label: "Birthday reminders", inApp: true, email: false },
  { key: "leave_request", label: "Leave requests", inApp: true, email: true },
  { key: "new_admission", label: "New admissions", inApp: true, email: false },
  { key: "exam_reminder", label: "Exam reminders", inApp: true, email: true },
  { key: "parent_message", label: "Parent messages", inApp: true, email: false },
  { key: "system_alert", label: "System alerts", inApp: true, email: true },
]

export default function ProfilePage() {
  const { user } = useCurrentUser()
  const { items: auditLog } = useAuditLog()

  // --- Overview (local-only — MockUser has no update mutator) -------------
  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email, phone: "" })

  // --- Security -------------------------------------------------------------
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" })
  const [sessions, setSessions] = useState<SessionRow[]>(DEFAULT_SESSIONS)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // --- Notifications (local-only "my preferences") -------------------------
  const [myPrefs, setMyPrefs] = useState<NotifPref[]>(DEFAULT_MY_PREFS)

  const myActivity = auditLog
    .filter((entry) => entry.actorId === user.id)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  const activityColumns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: "timestamp",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ getValue }) => <span className="capitalize">{getValue<string>().replace("_", " ")}</span>,
    },
    { accessorKey: "module", header: "Module" },
    { accessorKey: "description", header: "Description" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden py-0">
        <div className="h-24 bg-linear-to-r from-primary/80 to-primary" />
        <CardContent className="flex flex-col gap-4 pt-0 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
            <Avatar className="-mt-10 size-20 ring-4 ring-background">
              <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{user.name}</h1>
                <StatusBadge label={ROLE_LABELS[user.role]} tone="info" />
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
        <div className="grid grid-cols-2 divide-x border-t sm:grid-cols-4">
          {[
            { label: "Role", value: ROLE_LABELS[user.role] },
            { label: "Designation", value: user.designation },
            { label: "Joined", value: formatDate(user.joinedDate) },
            { label: "Last Login", value: formatDate(user.lastLogin) },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 p-4 text-center">
              <span className="text-lg font-semibold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Demo limitation: the signed-in mock user record has no update API (only role switching via
                &quot;Login as&quot;), so saving here shows a confirmation but does not persist the change.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  toast.success("Profile updated")
                }}
                className="flex flex-col gap-6"
              >
                <FieldGroup>
                  <div className="flex items-center gap-4">
                    <Avatar size="lg" className="size-16">
                      <AvatarFallback className="text-lg">{initials(profileForm.name || "?")}</AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" disabled>
                      <UploadIcon data-icon="inline-start" />
                      Upload Photo
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input
                        id="fullName"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="profileEmail">Email</FieldLabel>
                      <Input
                        id="profileEmail"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="profilePhone">Phone</FieldLabel>
                    <Input
                      id="profilePhone"
                      placeholder="Not set"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </Field>
                </FieldGroup>
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Demo only — no password is actually stored or verified.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!passwordForm.next || passwordForm.next !== passwordForm.confirm) {
                    toast.error("New password and confirmation must match.")
                    return
                  }
                  setPasswordForm({ current: "", next: "", confirm: "" })
                  toast.success("Password changed")
                }}
                className="flex flex-col gap-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.next}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                      />
                    </Field>
                  </div>
                </FieldGroup>
                <div className="flex justify-end">
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <ShieldIcon className="size-4 text-muted-foreground" />
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={(checked) => {
                  setTwoFactorEnabled(checked)
                  toast.success(checked ? "Two-factor authentication enabled" : "Two-factor authentication disabled")
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Devices currently signed in to your account.</CardDescription>
              </div>
              {sessions.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSessions([])
                    toast.success("Signed out of all other sessions")
                  }}
                >
                  Sign out all other sessions
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <EmptyState icon={ShieldIcon} title="No other active sessions" />
              ) : (
                <ItemGroup>
                  {sessions.map((session) => {
                    const Icon = session.device.includes("iPhone") ? SmartphoneIcon : session.device.includes("Mac") ? LaptopIcon : MonitorSmartphoneIcon
                    return (
                      <Item key={session.id} variant="outline">
                        <ItemMedia variant="icon">
                          <Icon />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{session.device}</ItemTitle>
                          <ItemDescription>
                            {session.browser} · {session.ip} · {session.lastActive}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSessions((prev) => prev.filter((s) => s.id !== session.id))
                              toast.success("Session signed out")
                            }}
                          >
                            Sign out
                          </Button>
                        </ItemActions>
                      </Item>
                    )
                  })}
                </ItemGroup>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Notification Preferences</CardTitle>
              <CardDescription>
                Personal delivery preferences — demo-only, separate from the school-wide defaults in Settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 pb-3 text-xs font-medium text-muted-foreground">
                  <span>Category</span>
                  <span className="w-16 text-center">In-app</span>
                  <span className="w-16 text-center">Email</span>
                </div>
                {myPrefs.map((pref) => (
                  <div key={pref.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4">
                    <p className="text-sm font-medium">{pref.label}</p>
                    <div className="flex w-16 justify-center">
                      <Switch
                        checked={pref.inApp}
                        onCheckedChange={(checked) =>
                          setMyPrefs((prev) => prev.map((p) => (p.key === pref.key ? { ...p, inApp: checked } : p)))
                        }
                      />
                    </div>
                    <div className="flex w-16 justify-center">
                      <Switch
                        checked={pref.email}
                        onCheckedChange={(checked) =>
                          setMyPrefs((prev) => prev.map((p) => (p.key === pref.key ? { ...p, email: checked } : p)))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end pt-4">
            <Button onClick={() => toast.success("Notification preferences saved")}>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {myActivity.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No activity yet"
              description="Actions you take across MyCampus360 will show up here."
            />
          ) : (
            <DataTable columns={activityColumns} data={myActivity} emptyTitle="No activity yet" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
