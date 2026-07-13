import {
  BarChart3Icon,
  CalendarCheckIcon,
  FileTextIcon,
  MegaphoneIcon,
  UserPlusIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: LucideIcon
  href: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "add-student", label: "Add Student", description: "Enroll a new student", icon: UserPlusIcon, href: "/students?action=add" },
  { id: "add-teacher", label: "Add Teacher", description: "Onboard a new teacher", icon: UserPlusIcon, href: "/teachers?action=add" },
  { id: "take-attendance", label: "Take Attendance", description: "Mark today's attendance", icon: CalendarCheckIcon, href: "/attendance" },
  { id: "collect-fee", label: "Collect Fee", description: "Record a fee payment", icon: WalletIcon, href: "/fees/collect" },
  { id: "create-notice", label: "Create Notice", description: "Publish an announcement", icon: MegaphoneIcon, href: "/campus-operations/announcements?action=create" },
  { id: "schedule-exam", label: "Schedule Exam", description: "Create a new examination", icon: FileTextIcon, href: "/examinations/new" },
  { id: "generate-report", label: "Generate Report", description: "Open the reports module", icon: BarChart3Icon, href: "/reports" },
]
