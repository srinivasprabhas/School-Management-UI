"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { BellIcon, CheckCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { NOTIFICATION_META } from "@/lib/data/notification-meta"
import { useNotifications } from "@/lib/data/store/entities"

export function NotificationBell() {
  const { items, update, isHydrated } = useNotifications()
  const unread = items.filter((n) => !n.read)
  const latest = [...items]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 8)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative" />
        }
      >
        <BellIcon />
        {isHydrated && unread.length > 0 ? (
          <span className="absolute top-1 right-1 flex size-2 rounded-full bg-destructive" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-80 p-0 sm:w-96 sm:max-w-none">
        <PopoverHeader className="flex-row items-center justify-between gap-2 px-3 pt-3 sm:px-4 sm:pt-4">
          <PopoverTitle>Notifications</PopoverTitle>
          {unread.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => unread.forEach((n) => update(n.id, { read: true }))}
            >
              <CheckCheckIcon data-icon="inline-start" />
              Mark all read
            </Button>
          ) : null}
        </PopoverHeader>
        <ScrollArea className="h-64 px-2 pb-2 sm:h-80">
          {latest.length === 0 ? (
            <Empty className="p-6">
              <EmptyMedia variant="icon">
                <BellIcon />
              </EmptyMedia>
              <EmptyTitle>No notifications</EmptyTitle>
              <EmptyDescription>You&apos;re all caught up.</EmptyDescription>
            </Empty>
          ) : (
            <ItemGroup>
              {latest.map((n) => {
                const meta = NOTIFICATION_META[n.type]
                const Icon = meta.icon
                return (
                  <Item key={n.id} size="sm" variant={n.read ? "default" : "muted"}>
                    <ItemMedia variant="icon">
                      <Icon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{n.title}</ItemTitle>
                      <ItemDescription>{n.message}</ItemDescription>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                      </span>
                    </ItemContent>
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            render={<Link href="/notifications" />}
            nativeButton={false}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
