"use client"

import { useMemo, useState } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAcademicSession, useClasses, useClassSections } from "@/lib/data/store/entities"
import { MonthlyPercentageTab } from "./monthly-percentage-tab"
import { ClassWiseTab } from "./class-wise-tab"
import { StudentHistoryTab } from "./student-history-tab"

export function AttendanceReports() {
  const { items: classes } = useClasses()
  const { items: classSections } = useClassSections()
  const { value: academicSession } = useAcademicSession()

  const [classId, setClassId] = useState("all")
  const [section, setSection] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const sectionOptions = useMemo(
    () => (classId === "all" ? [] : classSections.filter((cs) => cs.classId === classId)),
    [classId, classSections]
  )

  const classSectionIds = useMemo(() => {
    if (classId === "all") return classSections.map((cs) => cs.id)
    if (section === "all") return classSections.filter((cs) => cs.classId === classId).map((cs) => cs.id)
    const match = classSections.find((cs) => cs.classId === classId && cs.section === section)
    return match ? [match.id] : []
  }, [classId, section, classSections])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Reports"
        description="Attendance analytics across classes, sections, and students."
      />

      <div className="flex flex-wrap items-end gap-3">
        <FilterField label="Academic Year">
          <Select value={academicSession.year} disabled>
            <SelectTrigger className="w-32" disabled>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={academicSession.year}>{academicSession.year}</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Class">
          <Select
            value={classId}
            onValueChange={(v) => {
              setClassId(v ?? "all")
              setSection("all")
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Section">
          <Select value={section} onValueChange={(v) => setSection(v ?? "all")} disabled={classId === "all"}>
            <SelectTrigger className="w-32" disabled={classId === "all"}>
              <SelectValue placeholder="All sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sectionOptions.map((cs) => (
                <SelectItem key={cs.id} value={cs.section}>
                  {cs.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="From">
          <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </FilterField>
        <FilterField label="To">
          <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </FilterField>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Percentage</TabsTrigger>
          <TabsTrigger value="classwise">Class-wise Attendance</TabsTrigger>
          <TabsTrigger value="history">Student History</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly" className="mt-4">
          <MonthlyPercentageTab classSectionIds={classSectionIds} />
        </TabsContent>
        <TabsContent value="classwise" className="mt-4">
          <ClassWiseTab classSectionIds={classSectionIds} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <StudentHistoryTab classSectionIds={classSectionIds} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
