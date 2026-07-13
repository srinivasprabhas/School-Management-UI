"use client"

import { createContext, useCallback, useContext, useMemo } from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import { DEFAULT_USER, getMockUserByRole } from "./mock-users"
import type { MockUser, Role } from "./types"

interface CurrentUserContextValue {
  user: MockUser
  isHydrated: boolean
  loginAs: (role: Role) => void
  logout: () => void
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

const STORAGE_KEY = "mycampus360:current-user"

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const { value: user, setValue, clear, isHydrated } = useLocalStorage<MockUser>(
    STORAGE_KEY,
    DEFAULT_USER
  )

  const loginAs = useCallback(
    (role: Role) => {
      setValue(getMockUserByRole(role))
    },
    [setValue]
  )

  const logout = useCallback(() => {
    clear()
  }, [clear])

  const value = useMemo(
    () => ({ user, isHydrated, loginAs, logout }),
    [user, isHydrated, loginAs, logout]
  )

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider")
  }
  return ctx
}
