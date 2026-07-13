"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GlobalSearch } from "@/components/shared/global-search"
import { Breadcrumbs } from "./breadcrumbs"
import { NotificationBell } from "./notification-bell"
import { ThemeToggle } from "./theme-toggle"

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 min-w-0 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:rounded-t-xl">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <GlobalSearch />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  )
}
