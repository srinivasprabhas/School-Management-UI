"use client"

import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAcademicSession, useClasses, useClassSections } from "@/lib/data/store/entities"
import type { ReportFilters } from "./report-utils"

interface ReportFilterBarProps {
  filters: ReportFilters
  onChange: (patch: Partial<ReportFilters>) => void
  onGenerate: () => void
}

export function ReportFilterBar({ filters, onChange, onGenerate }: ReportFilterBarProps) {
  const { value: session } = useAcademicSession()
  const { items: classes } = useClasses()
  const { items: classSections } = useClassSections()

  const sections = classSections.filter((cs) => cs.classId === filters.classId)

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-year">Academic Year</Label>
        <Input id="report-year" value={session.year} readOnly disabled className="w-28" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-class">Class</Label>
        <Select
          value={filters.classId}
          onValueChange={(v) => onChange({ classId: v ?? "all", sectionId: "all" })}
        >
          <SelectTrigger id="report-class" className="w-40">
            <SelectValue />
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-section">Section</Label>
        <Select
          value={filters.sectionId}
          onValueChange={(v) => onChange({ sectionId: v ?? "all" })}
          disabled={filters.classId === "all"}
        >
          <SelectTrigger id="report-section" className="w-32">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((cs) => (
              <SelectItem key={cs.id} value={cs.id}>
                {cs.section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-from">From</Label>
        <Input
          id="report-from"
          type="date"
          className="w-40"
          value={filters.dateFrom}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-to">To</Label>
        <Input
          id="report-to"
          type="date"
          className="w-40"
          value={filters.dateTo}
          onChange={(e) => onChange({ dateTo: e.target.value })}
        />
      </div>

      <Button onClick={onGenerate}>
        <RefreshCwIcon data-icon="inline-start" />
        Generate Report
      </Button>
    </div>
  )
}
