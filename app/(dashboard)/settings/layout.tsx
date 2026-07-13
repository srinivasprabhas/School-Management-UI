import { PageHeader } from "@/components/shared/page-header"
import { RouteTabs } from "@/components/shared/route-tabs"

const TABS = [
  { label: "School", href: "/settings/school" },
  { label: "Academic", href: "/settings/academic" },
  { label: "Appearance", href: "/settings/appearance" },
  { label: "Notifications", href: "/settings/notifications" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage school, academic, and account preferences." />
      <RouteTabs tabs={TABS} />
      {children}
    </div>
  )
}
