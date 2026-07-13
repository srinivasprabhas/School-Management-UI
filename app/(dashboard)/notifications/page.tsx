"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BellIcon, CheckCheckIcon, CheckIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { useNotifications } from "@/lib/data/store/entities"
import { NOTIFICATION_META } from "@/lib/data/notification-meta"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Notification, NotificationType } from "@/lib/data/types"

const PAGE_SIZE = 10

type FilterTab = "all" | "unread" | "fee" | "leave" | "admission" | "exam" | "system"

const TAB_TYPES: Record<FilterTab, NotificationType[] | null> = {
  all: null,
  unread: null,
  fee: ["fee_due"],
  leave: ["leave_request"],
  admission: ["new_admission"],
  exam: ["exam_reminder"],
  // No literal "attendance" type exists in the data model, so that tab is omitted.
  // Birthday, parent-message and announcement notifications are folded into System
  // since the requested tab list didn't reserve a dedicated slot for them.
  system: ["system_alert", "announcement", "birthday", "parent_message"],
}

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "fee", label: "Fee" },
  { value: "leave", label: "Leave" },
  { value: "admission", label: "Admission" },
  { value: "exam", label: "Exam" },
  { value: "system", label: "System" },
]

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function dayGroupLabel(timestamp: string): string {
  const diffDays = Math.round((startOfDay(SEED_TODAY) - startOfDay(new Date(timestamp))) / 86_400_000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return "Earlier"
}

export default function NotificationsPage() {
  const { items, update, isHydrated } = useNotifications()
  const [tab, setTab] = useState<FilterTab>("all")
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const types = TAB_TYPES[tab]
    return [...items]
      .filter((n) => (tab === "unread" ? !n.read : true))
      .filter((n) => (types ? types.includes(n.type) : true))
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
  }, [items, tab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages - 1)
  const pageItems = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE)

  const groups = useMemo(() => {
    const order = ["Today", "Yesterday", "Earlier"]
    const map = new Map<string, Notification[]>()
    for (const n of pageItems) {
      const label = dayGroupLabel(n.timestamp)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(n)
    }
    return order.filter((label) => map.has(label)).map((label) => ({ label, items: map.get(label)! }))
  }, [pageItems])

  const unreadCount = items.filter((n) => !n.read).length

  function changeTab(value: string) {
    setTab(value as FilterTab)
    setPage(0)
  }

  function handleAccept(n: Notification) {
    update(n.id, { read: true })
    toast.success("Leave request approved", { description: n.title })
  }

  function handleDecline(n: Notification) {
    update(n.id, { read: true })
    toast.success("Leave request declined", { description: n.title })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description={isHydrated ? `${unreadCount} unread of ${items.length} total.` : "Loading…"}
        actions={
          <Button
            variant="outline"
            disabled={unreadCount === 0}
            onClick={() => {
              items.filter((n) => !n.read).forEach((n) => update(n.id, { read: true }))
              toast.success("All notifications marked as read")
            }}
          >
            <CheckCheckIcon data-icon="inline-start" />
            Mark All as Read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => changeTab(String(v))}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 flex flex-col gap-6">
          {pageItems.length === 0 ? (
            <EmptyState icon={BellIcon} title="No notifications" description="You're all caught up." />
          ) : (
            groups.map((group, index) => (
              <div key={group.label} className="flex flex-col gap-4">
                {index > 0 ? <Separator /> : null}
                <div className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </h3>
                <ItemGroup>
                  {group.items.map((n) => {
                    const meta = NOTIFICATION_META[n.type]
                    const Icon = meta.icon
                    return (
                      <Item key={n.id} variant={n.read ? "default" : "muted"}>
                        <ItemMedia variant="icon">
                          <Icon />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle className={cn(!n.read && "font-semibold")}>
                            {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
                            {n.title}
                          </ItemTitle>
                          <ItemDescription className={cn(n.read && "text-muted-foreground/70")}>
                            {n.message}
                          </ItemDescription>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(n.timestamp)} · {meta.label}
                          </span>
                        </ItemContent>
                        {n.actionable && !n.read ? (
                          <ItemActions>
                            <Button size="sm" variant="outline" onClick={() => handleAccept(n)}>
                              <CheckIcon data-icon="inline-start" />
                              Accept
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDecline(n)}>
                              <XIcon data-icon="inline-start" />
                              Decline
                            </Button>
                          </ItemActions>
                        ) : !n.read ? (
                          <ItemActions>
                            <Button size="sm" variant="ghost" onClick={() => update(n.id, { read: true })}>
                              Mark as read
                            </Button>
                          </ItemActions>
                        ) : null}
                      </Item>
                    )
                  })}
                </ItemGroup>
                </div>
              </div>
            ))
          )}

          {filtered.length > 0 ? (
            <>
              <Separator />
              <div className="flex items-center justify-between pt-0 text-sm text-muted-foreground">
              <span>
                Showing {pageSafe * PAGE_SIZE + 1}–{Math.min(filtered.length, pageSafe * PAGE_SIZE + PAGE_SIZE)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageSafe === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageSafe >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Next
                </Button>
              </div>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
