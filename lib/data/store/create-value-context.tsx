"use client"

import { createContext, useContext, useMemo } from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"

export interface ValueStore<T> {
  value: T
  set: (next: T | ((prev: T) => T)) => void
  isHydrated: boolean
}

/** Same localStorage-backed pattern as createEntityContext, but for a single settings object (no id/array). */
export function createValueContext<T>(storageKey: string, seed: T) {
  const Context = createContext<ValueStore<T> | null>(null)

  function Provider({ children }: { children: React.ReactNode }) {
    const { value, setValue, isHydrated } = useLocalStorage<T>(storageKey, seed)
    const ctxValue = useMemo<ValueStore<T>>(
      () => ({ value, set: setValue, isHydrated }),
      [value, setValue, isHydrated]
    )
    return <Context.Provider value={ctxValue}>{children}</Context.Provider>
  }

  function useStore(): ValueStore<T> {
    const ctx = useContext(Context)
    if (!ctx) {
      throw new Error(`Value store "${storageKey}" must be used within its Provider`)
    }
    return ctx
  }

  return { Provider, useStore }
}
