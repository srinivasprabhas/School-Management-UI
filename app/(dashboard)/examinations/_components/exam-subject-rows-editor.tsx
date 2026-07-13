"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ClassSection, Subject } from "@/lib/data/types"

export interface DraftExamSubjectRow {
  /** Stable client-side key used for React lists and row edits. */
  rowId: string
  /** The persisted ExamSubject id, if this row already exists in the store. */
  id?: string
  classSectionId: string
  subjectId: string
  examDate: string
  startTime: string
  durationMinutes: number
  maxMarks: number
  passMarks: number
}

let rowSeq = 0
export function createBlankExamSubjectRow(defaultClassSectionId = ""): DraftExamSubjectRow {
  rowSeq += 1
  return {
    rowId: `row_${Date.now()}_${rowSeq}`,
    classSectionId: defaultClassSectionId,
    subjectId: "",
    examDate: "",
    startTime: "09:00",
    durationMinutes: 90,
    maxMarks: 100,
    passMarks: 35,
  }
}

interface ExamSubjectRowsEditorProps {
  rows: DraftExamSubjectRow[]
  onChange: (rows: DraftExamSubjectRow[]) => void
  classSections: ClassSection[]
  subjects: Subject[]
}

export function ExamSubjectRowsEditor({ rows, onChange, classSections, subjects }: ExamSubjectRowsEditorProps) {
  function updateRow(rowId: string, patch: Partial<DraftExamSubjectRow>) {
    onChange(rows.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
  }
  function removeRow(rowId: string) {
    onChange(rows.filter((r) => r.rowId !== rowId))
  }
  function addRow() {
    onChange([...rows, createBlankExamSubjectRow(classSections[0]?.id ?? "")])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Exam Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead>Max Marks</TableHead>
              <TableHead>Pass Marks</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-20 text-center text-sm text-muted-foreground">
                  No subjects added yet. Click &ldquo;Add Subject Row&rdquo; to begin.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.rowId}>
                  <TableCell>
                    <Select value={row.subjectId} onValueChange={(v) => updateRow(row.rowId, { subjectId: v ?? "" })}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.classSectionId}
                      onValueChange={(v) => updateRow(row.rowId, { classSectionId: v ?? "" })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classSections.map((cs) => (
                          <SelectItem key={cs.id} value={cs.id}>
                            {cs.className} — {cs.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      className="w-36"
                      value={row.examDate}
                      onChange={(e) => updateRow(row.rowId, { examDate: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      className="w-28"
                      value={row.startTime}
                      onChange={(e) => updateRow(row.rowId, { startTime: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={row.durationMinutes}
                      onChange={(e) => updateRow(row.rowId, { durationMinutes: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={row.maxMarks}
                      onChange={(e) => updateRow(row.rowId, { maxMarks: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={row.passMarks}
                      onChange={(e) => updateRow(row.rowId, { passMarks: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(row.rowId)}>
                      <Trash2Icon />
                      <span className="sr-only">Remove row</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRow}>
        <PlusIcon data-icon="inline-start" />
        Add Subject Row
      </Button>
    </div>
  )
}
