"use client"

import { Toaster } from "@/components/ui/sonner"
import { AppDataProvider } from "@/lib/data/store/app-data-provider"
import { ThemeProvider } from "./theme-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AppDataProvider>
        {children}
        <Toaster position="top-right" />
      </AppDataProvider>
    </ThemeProvider>
  )
}
