"use client"

import { createContext, useCallback, useContext, useMemo } from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"

export interface EntityStore<T> {
  items: T[]
  add: (item: T) => void
  addMany: (items: T[]) => void
  update: (id: string, patch: Partial<T>) => void
  remove: (id: string) => void
  removeMany: (ids: string[]) => void
  setAll: (items: T[]) => void
  isHydrated: boolean
}

/**
 * Generic localStorage-backed CRUD store factory. Stores stay "dumb" —
 * toasts and destructive-action confirmation are the caller's responsibility.
 */
export function createEntityContext<T extends { id: string }>(
  storageKey: string,
  seed: T[]
) {
  const Context = createContext<EntityStore<T> | null>(null)

  function Provider({ children }: { children: React.ReactNode }) {
    const {
      value: items,
      setValue: setItems,
      isHydrated,
    } = useLocalStorage<T[]>(storageKey, seed)

    const add = useCallback((item: T) => setItems((prev) => [item, ...prev]), [setItems])
    const addMany = useCallback(
      (newItems: T[]) => setItems((prev) => [...newItems, ...prev]),
      [setItems]
    )
    const update = useCallback(
      (id: string, patch: Partial<T>) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
      [setItems]
    )
    const remove = useCallback(
      (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
      [setItems]
    )
    const removeMany = useCallback(
      (ids: string[]) => setItems((prev) => prev.filter((i) => !ids.includes(i.id))),
      [setItems]
    )
    const setAll = useCallback((next: T[]) => setItems(next), [setItems])

    const value = useMemo<EntityStore<T>>(
      () => ({ items, add, addMany, update, remove, removeMany, setAll, isHydrated }),
      [items, add, addMany, update, remove, removeMany, setAll, isHydrated]
    )

    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useStore(): EntityStore<T> {
    const ctx = useContext(Context)
    if (!ctx) {
      throw new Error(`Entity store "${storageKey}" must be used within its Provider`)
    }
    return ctx
  }

  return { Provider, useStore }
}
