"use client"

import { useState } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentsTab } from "./assignments-tab"
import { LessonPlansTab } from "./lesson-plans-tab"

type TabId = "assignments" | "lesson-plans"

export function AssignmentsView() {
  const [tab, setTab] = useState<TabId>("assignments")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Assignments" description="Homework, assignments, projects, and lesson plans." />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
        <TabsList>
          <TabsTrigger value="assignments">Assignments & Homework</TabsTrigger>
          <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments" className="pt-4">
          <AssignmentsTab />
        </TabsContent>
        <TabsContent value="lesson-plans" className="pt-4">
          <LessonPlansTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
