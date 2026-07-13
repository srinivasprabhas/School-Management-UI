"use client"

import { useState } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VehiclesPanel } from "./vehicles-panel"
import { RoutesPanel } from "./routes-panel"

export function TransportContent() {
  const [tab, setTab] = useState("vehicles")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transport"
        description="Manage the vehicle fleet and school bus routes."
      />

      <Tabs value={tab} onValueChange={(value) => setTab(String(value ?? "vehicles"))}>
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles" className="mt-4">
          <VehiclesPanel />
        </TabsContent>
        <TabsContent value="routes" className="mt-4">
          <RoutesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
