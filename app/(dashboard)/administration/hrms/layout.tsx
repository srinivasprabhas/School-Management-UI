import { PageHeader } from "@/components/shared/page-header"
import { RouteTabs } from "@/components/shared/route-tabs"

const TABS = [
  { label: "Staff", href: "/administration/hrms/staff" },
  { label: "Leave", href: "/administration/hrms/leave" },
  { label: "Payroll", href: "/administration/hrms/payroll" },
  { label: "Recruitment", href: "/administration/hrms/recruitment" },
]

export default function HrmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="HRMS" description="Staff directory, leave, payroll, and recruitment." />
      <RouteTabs tabs={TABS} />
      {children}
    </div>
  )
}
