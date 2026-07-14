"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Tracks whether an element has scrolled into the viewport. Fires once —
 * once `inView` flips true it stays true, so callers can gate a one-time
 * entrance animation (e.g. mounting a chart only when scrolled to).
 */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px", ...options })

    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, options])

  return { ref, inView } as const
}
