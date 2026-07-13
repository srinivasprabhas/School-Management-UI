"use client"

import { useState } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CatalogPanel } from "./catalog-panel"
import { CirculationPanel } from "./circulation-panel"
import { FinesPanel } from "./fines-panel"

export function LibraryContent() {
  const [tab, setTab] = useState("catalog")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Library" description="Book catalog, circulation, and fines." />

      <Tabs value={tab} onValueChange={(value) => setTab(String(value ?? "catalog"))}>
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="circulation">Circulation</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="mt-4">
          <CatalogPanel />
        </TabsContent>
        <TabsContent value="circulation" className="mt-4">
          <CirculationPanel />
        </TabsContent>
        <TabsContent value="fines" className="mt-4">
          <FinesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
