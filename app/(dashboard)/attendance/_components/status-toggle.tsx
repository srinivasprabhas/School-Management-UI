"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toneForStatus } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"
import type { AttendanceStatus } from "@/lib/data/types"
import { STATUS_OPTIONS } from "./attendance-utils"

const TONE_ON_CLASSES: Record<string, string> = {
  success: "data-[state=on]:bg-success/20 data-[state=on]:text-success",
  warning: "data-[state=on]:bg-warning/20 data-[state=on]:text-warning",
  destructive: "data-[state=on]:bg-destructive/20 data-[state=on]:text-destructive",
  info: "data-[state=on]:bg-info/20 data-[state=on]:text-info",
  neutral: "data-[state=on]:bg-muted",
}

interface AttendanceStatusToggleProps {
  value?: AttendanceStatus
  onChange: (status: AttendanceStatus) => void
  size?: "sm" | "default"
}

/** Shared 5-option P / A / L / Lv / HD status picker — reused by the daily roster rows and the
 * monthly grid's correction popover. Behaves like a radio group: clicking the already-selected
 * option is a no-op rather than clearing the selection. */
export function AttendanceStatusToggle({ value, onChange, size = "sm" }: AttendanceStatusToggleProps) {
  return (
    <ToggleGroup
      variant="outline"
      size={size}
      spacing={0}
      value={value ? [value] : []}
      onValueChange={(next) => {
        if (next.length > 0) onChange(next[0] as AttendanceStatus)
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          aria-label={opt.full}
          title={opt.full}
          className={cn("px-2 text-xs", TONE_ON_CLASSES[toneForStatus(opt.value)])}
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
