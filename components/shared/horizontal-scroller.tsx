"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HorizontalScrollerProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Wraps wide content (grids, wide tables) in its own scroll boundary with a thin
 * custom scrollbar plus floating scroll-left/scroll-right buttons that only appear
 * when there's more content in that direction — used instead of the plain native
 * scrollbar for the app's widest widgets (attendance grid, timetable).
 */
export function HorizontalScroller({ children, className, contentClassName }: HorizontalScrollerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener("resize", update)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [update])

  function scrollBy(direction: 1 | -1) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: "smooth" })
  }

  return (
    <div className={cn("relative", className)}>
      {canLeft ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute top-1/2 left-1.5 z-20 -translate-y-1/2 rounded-full shadow-md"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon />
          </Button>
        </>
      ) : null}
      <div ref={ref} className={cn("scrollbar-thin overflow-x-auto", contentClassName)}>
        {children}
      </div>
      {canRight ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute top-1/2 right-1.5 z-20 -translate-y-1/2 rounded-full shadow-md"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
          >
            <ChevronRightIcon />
          </Button>
        </>
      ) : null}
    </div>
  )
}
