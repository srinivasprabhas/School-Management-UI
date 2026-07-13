import {
  AlertTriangleIcon,
  BellRingIcon,
  CakeIcon,
  CalendarClockIcon,
  MailIcon,
  MegaphoneIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react"

import type { Notification } from "@/lib/data/types"
import type { StatusTone } from "@/components/shared/status-badge"

export const NOTIFICATION_META: Record<
  Notification["type"],
  { label: string; icon: LucideIcon; tone: StatusTone }
> = {
  fee_due: { label: "Fee Due", icon: BellRingIcon, tone: "warning" },
  birthday: { label: "Birthday", icon: CakeIcon, tone: "info" },
  leave_request: { label: "Leave Request", icon: CalendarClockIcon, tone: "info" },
  new_admission: { label: "New Admission", icon: UserPlusIcon, tone: "success" },
  exam_reminder: { label: "Exam Reminder", icon: AlertTriangleIcon, tone: "warning" },
  parent_message: { label: "Parent Message", icon: MailIcon, tone: "info" },
  system_alert: { label: "System Alert", icon: AlertTriangleIcon, tone: "destructive" },
  announcement: { label: "Announcement", icon: MegaphoneIcon, tone: "info" },
}
