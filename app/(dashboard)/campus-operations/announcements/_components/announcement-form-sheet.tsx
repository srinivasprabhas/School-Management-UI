"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { Textarea } from "@/components/ui/textarea"
import { useLogActivity } from "@/lib/data/audit"
import { useNotifications } from "@/lib/data/store/entities"
import { useCurrentUser } from "@/lib/rbac/current-user-context"
import { toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { Announcement } from "@/lib/data/types"

const TYPE_LABEL: Record<Announcement["type"], string> = {
  announcement: "Announcement",
  circular: "Circular",
  newsletter: "Newsletter",
}

const AUDIENCE_OPTIONS = ["All", "Students", "Teachers", "Parents"]

interface AnnouncementFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement?: Announcement
  onSubmit: (announcement: Announcement) => void
}

export function AnnouncementFormSheet({
  open,
  onOpenChange,
  announcement,
  onSubmit,
}: AnnouncementFormSheetProps) {
  const { user } = useCurrentUser()
  const { add: addNotification } = useNotifications()
  const logActivity = useLogActivity()

  const [title, setTitle] = useState("")
  const [type, setType] = useState<Announcement["type"]>("announcement")
  const [audience, setAudience] = useState<string[]>(["All"])
  const [body, setBody] = useState("")
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now")
  const [scheduledDate, setScheduledDate] = useState(toISODate(SEED_TODAY))
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(announcement?.title ?? "")
      setType(announcement?.type ?? "announcement")
      setAudience(announcement?.audience ?? ["All"])
      setBody(announcement?.body ?? "")
      setPublishMode(announcement?.status === "scheduled" ? "schedule" : "now")
      setScheduledDate(announcement?.publishDate ?? toISODate(SEED_TODAY))
    }
  }, [open, announcement])

  function toggleAudience(option: string, checked: boolean) {
    setAudience((prev) => (checked ? [...prev, option] : prev.filter((a) => a !== option)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in the title and body.")
      return
    }
    if (audience.length === 0) {
      toast.error("Please select at least one audience.")
      return
    }
    setPending(true)

    const base = announcement
    const isPublishNow = publishMode === "now"
    const result: Announcement = {
      id: base?.id ?? `ann_new_${Date.now()}`,
      title,
      type,
      audience,
      body,
      authorId: base?.authorId ?? user.id,
      createdDate: base?.createdDate ?? toISODate(SEED_TODAY),
      publishDate: isPublishNow ? toISODate(SEED_TODAY) : scheduledDate,
      status: isPublishNow ? "published" : "scheduled",
    }

    setTimeout(() => {
      onSubmit(result)
      if (!base && isPublishNow) {
        addNotification({
          id: `notif_ann_${result.id}`,
          type: "announcement",
          title: result.title,
          message: result.body.slice(0, 140),
          timestamp: new Date().toISOString(),
          read: false,
          actionable: false,
          severity: "info",
        })
      }
      logActivity({
        action: base ? "update" : "create",
        module: "Announcements",
        entityType: "Announcement",
        entityId: result.id,
        description: `${base ? "Updated" : isPublishNow ? "Published" : "Scheduled"} notice "${result.title}"`,
      })
      toast.success(base ? "Notice updated" : isPublishNow ? "Notice published" : "Notice scheduled", {
        description: isPublishNow ? result.title : `${result.title} — ${scheduledDate}`,
      })
      setPending(false)
      onOpenChange(false)
    }, 250)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full scrollbar-thin overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{announcement ? "Edit Notice" : "Create Notice"}</SheetTitle>
          <SheetDescription>
            {announcement
              ? "Update this notice's details."
              : "Compose an announcement, circular, or newsletter to publish to your audience."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between gap-6 px-4 pb-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="noticeTitle">Title</FieldLabel>
              <Input id="noticeTitle" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="noticeType">Type</FieldLabel>
              <Select value={type} onValueChange={(v) => setType((v ?? "announcement") as Announcement["type"])}>
                <SelectTrigger id="noticeType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Audience</FieldLabel>
              <div className="flex flex-col gap-2">
                {AUDIENCE_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={audience.includes(option)}
                      onCheckedChange={(checked) => toggleAudience(option, !!checked)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="noticeBody">Body</FieldLabel>
              <Textarea
                id="noticeBody"
                required
                rows={6}
                placeholder="Write the notice content here…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Publish</FieldLabel>
              <RadioGroup
                value={publishMode}
                onValueChange={(v) => setPublishMode(v as "now" | "schedule")}
                className="grid grid-cols-2 gap-2"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="now" />
                  Publish now
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="schedule" />
                  Schedule
                </label>
              </RadioGroup>
            </Field>
            {publishMode === "schedule" ? (
              <Field>
                <FieldLabel htmlFor="scheduledDate">Publish date</FieldLabel>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </Field>
            ) : null}
          </FieldGroup>

          <SheetFooter className="flex-row justify-end gap-2 p-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {announcement ? "Save Changes" : publishMode === "now" ? "Publish Now" : "Schedule Notice"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
