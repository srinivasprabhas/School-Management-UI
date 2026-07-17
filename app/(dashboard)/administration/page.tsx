import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRightIcon, BarChart3Icon, BriefcaseIcon, HistoryIcon, ShieldCheckIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { toneBgClass, type StatusTone } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdminLink {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  tone: StatusTone
}

const ADMIN_LINKS: AdminLink[] = [
  {
    id: "hrms",
    label: "HRMS",
    description: "Staff directory, leave, payroll, and recruitment.",
    href: "/administration/hrms/staff",
    icon: BriefcaseIcon,
    tone: "warning",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Leadership BI dashboard with cross-module insights.",
    href: "/administration/analytics",
    icon: BarChart3Icon,
    tone: "info",
  },
  {
    id: "users-roles",
    label: "Users & Roles",
    description: "Manage app users, invitations, and role permissions.",
    href: "/administration/users-roles",
    icon: ShieldCheckIcon,
    tone: "success",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    description: "Immutable trail of every create, update, and delete.",
    href: "/administration/audit-logs",
    icon: HistoryIcon,
    tone: "destructive",
  },
]

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Administration" description="HR, analytics and administration." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ADMIN_LINKS.map((link) => (
          <Link key={link.id} href={link.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <div className={cn("flex size-9 items-center justify-center rounded-lg", toneBgClass(link.tone))}>
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
