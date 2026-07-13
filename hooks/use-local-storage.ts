"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * SSR-safe localStorage-backed state. Always initializes from `initialValue`
 * (deterministic, server-safe) and swaps in the persisted value after mount,
 * so server and first-client-render HTML match exactly.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        setValue(JSON.parse(stored) as T)
      }
    } catch {
      // ignore malformed/inaccessible storage
    } finally {
      setIsHydrated(true)
    }
  }, [key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // ignore quota/serialization errors
        }
        return resolved
      })
    },
    [key]
  )

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
    setValue(initialValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { value, setValue: update, clear, isHydrated } as const
}
