"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/shared/page-header"

interface CategoryPref {
  key: string
  label: string
  description: string
  inApp: boolean
  email: boolean
}

const DEFAULT_CATEGORIES: CategoryPref[] = [
  { key: "fee_due", label: "Fee due reminders", description: "Upcoming and overdue fee installments.", inApp: true, email: true },
  { key: "birthday", label: "Birthday reminders", description: "Student and staff birthdays.", inApp: true, email: false },
  { key: "leave_request", label: "Leave requests", description: "Staff leave applications awaiting action.", inApp: true, email: true },
  { key: "new_admission", label: "New admissions", description: "New admission leads and enrollments.", inApp: true, email: false },
  { key: "exam_reminder", label: "Exam reminders", description: "Upcoming exams and result publishing.", inApp: true, email: true },
  { key: "parent_message", label: "Parent messages", description: "Messages sent in by parents.", inApp: true, email: false },
  { key: "system_alert", label: "System alerts", description: "Critical system and security alerts.", inApp: true, email: true },
]

export default function NotificationSettingsPage() {
  const [categories, setCategories] = useState<CategoryPref[]>(DEFAULT_CATEGORIES)

  function toggle(key: string, field: "inApp" | "email", value: boolean) {
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)))
  }

  function handleSave() {
    toast.success("Notification preferences saved")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notification Settings" description="Notification preferences." />

      <Card>
        <CardHeader>
          <CardTitle>Delivery Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified for each category. These preferences are demo-only and are not
            wired to the live notification feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 pb-3 text-xs font-medium text-muted-foreground">
              <span>Category</span>
              <span className="w-16 text-center">In-app</span>
              <span className="w-16 text-center">Email</span>
            </div>
            {categories.map((category) => (
              <div key={category.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">{category.label}</p>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
                <div className="flex w-16 justify-center">
                  <Switch
                    checked={category.inApp}
                    onCheckedChange={(checked) => toggle(category.key, "inApp", checked)}
                  />
                </div>
                <div className="flex w-16 justify-center">
                  <Switch
                    checked={category.email}
                    onCheckedChange={(checked) => toggle(category.key, "email", checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
}
