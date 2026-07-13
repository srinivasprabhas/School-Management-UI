"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface RouteTab {
  label: string
  href: string
}

export function RouteTabs({ tabs, className }: { tabs: RouteTab[]; className?: string }) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-1 overflow-x-auto rounded-lg bg-muted p-[3px] text-muted-foreground",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
