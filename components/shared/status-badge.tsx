import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusTone = "success" | "warning" | "destructive" | "info" | "neutral"

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/10 text-success dark:bg-success/20",
  warning: "bg-warning/10 text-warning dark:bg-warning/20",
  destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  info: "bg-info/10 text-info dark:bg-info/20",
  neutral: "bg-secondary text-secondary-foreground",
}

interface StatusBadgeProps {
  label: string
  tone: StatusTone
  icon?: LucideIcon
  className?: string
}

export function StatusBadge({ label, tone, icon: Icon, className }: StatusBadgeProps) {
  return (
    <Badge variant="default" className={cn(TONE_CLASSES[tone], className)}>
      {Icon ? <Icon data-icon="inline-start" /> : null}
      {label}
    </Badge>
  )
}

const ATTENDANCE_TONE: Record<string, StatusTone> = {
  present: "success",
  active: "success",
  paid: "success",
  published: "success",
  approved: "success",
  hired: "success",
  enrolled: "success",
  completed: "success",
  returned: "success",
  late: "warning",
  half_day: "warning",
  pending: "warning",
  partial: "warning",
  draft: "warning",
  scheduled: "warning",
  processing: "warning",
  issued: "warning",
  absent: "destructive",
  inactive: "destructive",
  overdue: "destructive",
  suspended: "destructive",
  rejected: "destructive",
  cancelled: "destructive",
  failed: "destructive",
  leave: "info",
  system: "info",
  invited: "info",
  interview: "info",
  offer: "info",
  application: "info",
  inquiry: "info",
  screening: "info",
  applied: "info",
  archived: "neutral",
  graduated: "neutral",
  closed: "neutral",
  on_hold: "neutral",
}

/** Maps a common lowercase status string onto the shared RAG tone convention. */
export function toneForStatus(status: string): StatusTone {
  return ATTENDANCE_TONE[status.toLowerCase()] ?? "neutral"
}

const TONE_BG_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  destructive: "bg-destructive/20 text-destructive",
  info: "bg-info/20 text-info",
  neutral: "bg-muted text-muted-foreground",
}

/** Solid-tint background class for the given tone — used outside the Badge component (e.g. heatmap cells). */
export function toneBgClass(tone: StatusTone): string {
  return TONE_BG_CLASSES[tone]
}
