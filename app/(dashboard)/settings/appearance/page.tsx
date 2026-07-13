"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { CheckIcon, LaptopIcon, MoonIcon, SunIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PageHeader } from "@/components/shared/page-header"
import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon, description: "Bright background, dark text." },
  { value: "dark", label: "Dark", icon: MoonIcon, description: "Dark background, easy on the eyes." },
  { value: "system", label: "System", icon: LaptopIcon, description: "Matches your device setting." },
] as const

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [density, setDensity] = useState("comfortable")

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Appearance" description="Theme preferences." />

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose how MyCampus360 looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon
              const isActive = mounted && theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/50",
                    isActive ? "border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  {isActive ? (
                    <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-3.5" />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "flex h-20 items-center justify-center rounded-lg border",
                      option.value === "dark"
                        ? "bg-neutral-900"
                        : option.value === "light"
                          ? "bg-neutral-50"
                          : "bg-linear-to-br from-neutral-50 to-neutral-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-8",
                        option.value === "dark"
                          ? "text-neutral-100"
                          : option.value === "light"
                            ? "text-neutral-900"
                            : "text-neutral-500"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Table Density</CardTitle>
          <CardDescription>
            Preview control for row spacing across data tables. (Demo only — doesn&apos;t change spacing app-wide.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            variant="outline"
            value={[density]}
            onValueChange={(v) => {
              if (v[0]) setDensity(v[0])
            }}
          >
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>
    </div>
  )
}
