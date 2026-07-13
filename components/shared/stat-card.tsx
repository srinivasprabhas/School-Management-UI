import type { LucideIcon } from "lucide-react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: number; direction: "up" | "down"; label?: string }
  description?: string
  variant?: "default" | "primary" | "info" | "success" | "warning" | "destructive"
  onClick?: () => void
  className?: string
}

const VARIANT_ICON_BG: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = "default",
  onClick,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(onClick && "cursor-pointer transition-colors hover:bg-muted/40", className)}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon ? (
          <CardAction>
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg",
                VARIANT_ICON_BG[variant]
              )}
            >
              <Icon className="size-4" />
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
        </div>
        {trend ? (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-success" : "text-destructive"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUpIcon className="size-3.5" />
            ) : (
              <TrendingDownIcon className="size-3.5" />
            )}
            {trend.value}% {trend.label}
          </span>
        ) : null}
      </CardContent>
    </Card>
  )
}
