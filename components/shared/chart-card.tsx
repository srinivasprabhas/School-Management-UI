"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  description?: string
  config: ChartConfig
  children: React.ComponentProps<typeof ChartContainer>["children"]
  footer?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ChartCard({
  title,
  description,
  config,
  children,
  footer,
  actions,
  className,
}: ChartCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className={actions ? "flex-row items-start justify-between" : undefined}>
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="flex-1">
        <div ref={ref} className="aspect-auto h-64 w-full">
          {inView ? (
            <ChartContainer config={config} className="aspect-auto h-64 w-full">
              {children}
            </ChartContainer>
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </div>
      </CardContent>
      {footer ? (
        <CardFooter className="flex-col items-start gap-1 border-t pt-(--card-spacing) text-sm">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  )
}
