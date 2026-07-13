"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ADMIN_NAV_GROUPS, PORTAL_NAV_GROUPS } from "@/lib/nav/nav-config"
import type { NavItem } from "@/lib/nav/types"

function findLabel(href: string): string | undefined {
  const allItems: NavItem[] = [...ADMIN_NAV_GROUPS, ...PORTAL_NAV_GROUPS].flatMap((g) => g.items)
  const flat: NavItem[] = allItems.flatMap((i) => [i, ...(i.items ?? [])])
  return flat.find((i) => i.href === href)?.label
}

function humanize(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = findLabel(href) ?? humanize(segment)
    return { href, label }
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="hidden md:inline-flex"
                  render={<Link href={crumb.href} />}
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
