"use client"

import { useState } from "react"
import { toast } from "sonner"
import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon, RotateCcwIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClasses, useClassSections } from "@/lib/data/store/entities"
import { formatDate } from "@/lib/format"
import { AdmissionsReport } from "./categories/admissions-report"
import { AttendanceReport, TeacherAttendanceReport } from "./categories/attendance-reports"
import { ExaminationReport } from "./categories/examination-report"
import { FeesReport } from "./categories/fees-report"
import { LibraryReport } from "./categories/library-report"
import { PerformanceReport } from "./categories/performance-report"
import { TransportReport } from "./categories/transport-report"
import { ReportFilterBar } from "./report-filter-bar"
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from "./report-utils"

const CATEGORIES = [
  { id: "attendance", label: "Attendance" },
  { id: "fees", label: "Fees" },
  { id: "examination", label: "Examination" },
  { id: "admissions", label: "Admissions" },
  { id: "performance", label: "Student Performance" },
  { id: "transport", label: "Transport" },
  { id: "library", label: "Library" },
  { id: "teacher-attendance", label: "Teacher Attendance" },
] as const

type CategoryId = (typeof CATEGORIES)[number]["id"]

interface RecentReportEntry {
  id: string
  name: string
  filters: string
  generatedOn: string
}

let reportSeq = 0

export function ReportsView() {
  const [activeTab, setActiveTab] = useState<CategoryId>("attendance")
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS)
  const [recentReports, setRecentReports] = useState<RecentReportEntry[]>([])

  const { items: classes } = useClasses()
  const { items: classSections } = useClassSections()

  function patchFilters(patch: Partial<ReportFilters>) {
    setFilters((f) => ({ ...f, ...patch }))
  }

  function filtersSummary(): string {
    const parts: string[] = []
    const cls = classes.find((c) => c.id === filters.classId)
    parts.push(cls ? cls.name : "All Classes")
    if (filters.sectionId !== "all") {
      const sec = classSections.find((cs) => cs.id === filters.sectionId)
      if (sec) parts.push(`Section ${sec.section}`)
    }
    if (filters.dateFrom || filters.dateTo) {
      parts.push(`${filters.dateFrom || "…"} to ${filters.dateTo || "…"}`)
    }
    return parts.join(" · ")
  }

  const activeLabel = CATEGORIES.find((c) => c.id === activeTab)?.label ?? "Report"

  function handleGenerate() {
    reportSeq += 1
    setRecentReports((prev) => [
      {
        id: `rep_${reportSeq}`,
        name: `${activeLabel} Report`,
        filters: filtersSummary(),
        generatedOn: new Date().toISOString(),
      },
      ...prev,
    ])
    toast.success("Report generated", { description: `${activeLabel} report is ready to view below.` })
  }

  function handleExport(format: string) {
    toast.success("Export started", {
      description: `Exporting the ${activeLabel} report to ${format}…`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Generate and export school reports across every module." />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryId)}>
        <TabsList className="h-auto! flex-wrap justify-start gap-1">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex flex-col gap-4 pt-4">
          <ReportFilterBar filters={filters} onChange={patchFilters} onGenerate={handleGenerate} />

          <TabsContent value="attendance">
            <AttendanceReport filters={filters} />
          </TabsContent>
          <TabsContent value="fees">
            <FeesReport filters={filters} />
          </TabsContent>
          <TabsContent value="examination">
            <ExaminationReport filters={filters} />
          </TabsContent>
          <TabsContent value="admissions">
            <AdmissionsReport filters={filters} />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceReport filters={filters} />
          </TabsContent>
          <TabsContent value="transport">
            <TransportReport filters={filters} />
          </TabsContent>
          <TabsContent value="library">
            <LibraryReport filters={filters} />
          </TabsContent>
          <TabsContent value="teacher-attendance">
            <TeacherAttendanceReport filters={filters} />
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => handleExport("PDF")}>
          <FileTextIcon data-icon="inline-start" />
          Export PDF
        </Button>
        <Button variant="outline" onClick={() => handleExport("Excel")}>
          <FileSpreadsheetIcon data-icon="inline-start" />
          Export Excel
        </Button>
        <Button variant="outline" onClick={() => handleExport("CSV")}>
          <DownloadIcon data-icon="inline-start" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports generated yet this session.</p>
          ) : (
            <ItemGroup>
              {recentReports.map((r) => (
                <Item key={r.id} size="sm">
                  <ItemMedia variant="icon">
                    <FileTextIcon />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{r.name}</ItemTitle>
                    <ItemDescription>
                      {r.filters} — generated {formatDate(r.generatedOn)}
                    </ItemDescription>
                  </ItemContent>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success("Re-download started", { description: r.name })}
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    Re-download
                  </Button>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
