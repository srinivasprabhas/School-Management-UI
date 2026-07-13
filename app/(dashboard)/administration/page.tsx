import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRightIcon, BarChart3Icon, BriefcaseIcon, HistoryIcon, ShieldCheckIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminLink {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
}

const ADMIN_LINKS: AdminLink[] = [
  {
    id: "hrms",
    label: "HRMS",
    description: "Staff directory, leave, payroll, and recruitment.",
    href: "/administration/hrms/staff",
    icon: BriefcaseIcon,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Leadership BI dashboard with cross-module insights.",
    href: "/administration/analytics",
    icon: BarChart3Icon,
  },
  {
    id: "users-roles",
    label: "Users & Roles",
    description: "Manage app users, invitations, and role permissions.",
    href: "/administration/users-roles",
    icon: ShieldCheckIcon,
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    description: "Immutable trail of every create, update, and delete.",
    href: "/administration/audit-logs",
    icon: HistoryIcon,
  },
]

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Administration" description="HR, analytics and administration." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_LINKS.map((link) => (
          <Link key={link.id} href={link.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <link.icon className="size-4" />
                </div>
                <CardTitle className="flex items-center justify-between gap-2 pt-2">
                  {link.label}
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </CardTitle>
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
