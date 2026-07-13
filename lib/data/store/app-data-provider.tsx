"use client"

import { CurrentUserProvider } from "@/lib/rbac/current-user-context"
import { ALL_ENTITY_PROVIDERS } from "./entities"

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const content = ALL_ENTITY_PROVIDERS.reduceRight<React.ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  )

  return <CurrentUserProvider>{content}</CurrentUserProvider>
}
