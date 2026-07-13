import Link from "next/link"
import type { Metadata } from "next"
import {
  BusIcon,
  LibraryIcon,
  MegaphoneIcon,
  PartyPopperIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Campus Operations — MyCampus360",
}

interface OperationLink {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
}

const OPERATION_LINKS: OperationLink[] = [
  {
    id: "transport",
    title: "Transport",
    description: "Manage the vehicle fleet, drivers, and bus routes.",
    href: "/campus-operations/transport",
    icon: BusIcon,
  },
  {
    id: "library",
    title: "Library",
    description: "Track the book catalog, circulation, and fines.",
    href: "/campus-operations/library",
    icon: LibraryIcon,
  },
  {
    id: "admissions",
    title: "Admissions",
    description: "Run the enquiry-to-enrollment admissions pipeline.",
    href: "/campus-operations/admissions",
    icon: UserPlusIcon,
  },
  {
    id: "events",
    title: "Events",
    description: "Plan and track school events and celebrations.",
    href: "/campus-operations/events",
    icon: PartyPopperIcon,
  },
  {
    id: "announcements",
    title: "Announcements",
    description: "Publish notices, circulars, and newsletters.",
    href: "/campus-operations/announcements",
    icon: MegaphoneIcon,
  },
]

export default function CampusOperationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campus Operations"
        description="Transport, library, admissions, events and announcements — all in one place."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OPERATION_LINKS.map((link) => (
          <Link key={link.id} href={link.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <link.icon className="size-4" />
                </div>
                <CardTitle className="mt-2">{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
