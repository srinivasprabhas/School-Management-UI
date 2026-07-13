"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CalendarRangeIcon, GraduationCapIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { useAcademicSession, useGradeScale } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { formatDate } from "@/lib/format"
import type { AcademicTerm, GradeScale } from "@/lib/data/types"

export default function AcademicSettingsPage() {
  const { value: session, set: setSession, isHydrated } = useAcademicSession()
  const { items: gradeScale, add: addGrade, update: updateGrade, remove: removeGrade } = useGradeScale()
  const logActivity = useLogActivity()

  const [sessionForm, setSessionForm] = useState({
    year: session.year,
    startDate: session.startDate,
    endDate: session.endDate,
  })

  useEffect(() => {
    if (isHydrated) {
      setSessionForm({ year: session.year, startDate: session.startDate, endDate: session.endDate })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated])

  function saveSession(e: React.FormEvent) {
    e.preventDefault()
    setSession({ ...session, ...sessionForm })
    logActivity({
      action: "update",
      module: "Settings",
      entityType: "AcademicSession",
      description: `Updated academic session ${sessionForm.year}`,
    })
    toast.success("Academic session saved")
  }

  // --- Terms -------------------------------------------------------------
  const [termDialogOpen, setTermDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null)
  const [termForm, setTermForm] = useState({ name: "", startDate: "", endDate: "" })
  const [deletingTerm, setDeletingTerm] = useState<AcademicTerm | null>(null)

  function openAddTerm() {
    setEditingTerm(null)
    setTermForm({ name: "", startDate: "", endDate: "" })
    setTermDialogOpen(true)
  }

  function openEditTerm(term: AcademicTerm) {
    setEditingTerm(term)
    setTermForm({ name: term.name, startDate: term.startDate, endDate: term.endDate })
    setTermDialogOpen(true)
  }

  function saveTerm(e: React.FormEvent) {
    e.preventDefault()
    const nextTerms = editingTerm
      ? session.terms.map((t) =>
          t.id === editingTerm.id ? { ...t, ...termForm } : t
        )
      : [...session.terms, { id: `term_${Date.now()}`, ...termForm }]
    setSession({ ...session, terms: nextTerms })
    logActivity({
      action: editingTerm ? "update" : "create",
      module: "Settings",
      entityType: "AcademicTerm",
      description: `${editingTerm ? "Updated" : "Added"} term ${termForm.name}`,
    })
    toast.success(editingTerm ? "Term updated" : "Term added")
    setTermDialogOpen(false)
  }

  function confirmDeleteTerm() {
    if (!deletingTerm) return
    setSession({ ...session, terms: session.terms.filter((t) => t.id !== deletingTerm.id) })
    logActivity({
      action: "delete",
      module: "Settings",
      entityType: "AcademicTerm",
      description: `Deleted term ${deletingTerm.name}`,
    })
    toast.success("Term deleted")
    setDeletingTerm(null)
  }

  // --- Grading scale -------------------------------------------------------
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<GradeScale | null>(null)
  const [gradeForm, setGradeForm] = useState({ label: "", minPercent: 0, maxPercent: 0, remark: "" })
  const [deletingGrade, setDeletingGrade] = useState<GradeScale | null>(null)

  function openAddGrade() {
    setEditingGrade(null)
    setGradeForm({ label: "", minPercent: 0, maxPercent: 0, remark: "" })
    setGradeDialogOpen(true)
  }

  function openEditGrade(grade: GradeScale) {
    setEditingGrade(grade)
    setGradeForm({
      label: grade.label,
      minPercent: grade.minPercent,
      maxPercent: grade.maxPercent,
      remark: grade.remark,
    })
    setGradeDialogOpen(true)
  }

  function saveGrade(e: React.FormEvent) {
    e.preventDefault()
    if (editingGrade) {
      updateGrade(editingGrade.id, gradeForm)
    } else {
      addGrade({ id: `grade_${Date.now()}`, ...gradeForm })
    }
    logActivity({
      action: editingGrade ? "update" : "create",
      module: "Settings",
      entityType: "GradeScale",
      description: `${editingGrade ? "Updated" : "Added"} grade band ${gradeForm.label}`,
    })
    toast.success(editingGrade ? "Grade band updated" : "Grade band added")
    setGradeDialogOpen(false)
  }

  function confirmDeleteGrade() {
    if (!deletingGrade) return
    removeGrade(deletingGrade.id)
    logActivity({
      action: "delete",
      module: "Settings",
      entityType: "GradeScale",
      description: `Deleted grade band ${deletingGrade.label}`,
    })
    toast.success("Grade band deleted")
    setDeletingGrade(null)
  }

  const sortedGrades = [...gradeScale].sort((a, b) => b.minPercent - a.minPercent)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Academic Settings" description="Academic session settings." />

      <Card>
        <CardHeader>
          <CardTitle>Academic Session</CardTitle>
          <CardDescription>The current academic year&apos;s overall date range.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSession} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="year">Academic year</FieldLabel>
                <Input
                  id="year"
                  required
                  value={sessionForm.year}
                  onChange={(e) => setSessionForm((f) => ({ ...f, year: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sessionStart">Start date</FieldLabel>
                <Input
                  id="sessionStart"
                  type="date"
                  required
                  value={sessionForm.startDate}
                  onChange={(e) => setSessionForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sessionEnd">End date</FieldLabel>
                <Input
                  id="sessionEnd"
                  type="date"
                  required
                  value={sessionForm.endDate}
                  onChange={(e) => setSessionForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Session</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Terms</CardTitle>
            <CardDescription>Terms within the current academic session.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={openAddTerm}>
            <PlusIcon data-icon="inline-start" />
            Add Term
          </Button>
        </CardHeader>
        <CardContent>
          {session.terms.length === 0 ? (
            <EmptyState icon={CalendarRangeIcon} title="No terms yet" description="Add your first term to get started." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.terms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell>{formatDate(term.startDate)}</TableCell>
                    <TableCell>{formatDate(term.endDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditTerm(term)}>
                          <PencilIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeletingTerm(term)}>
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Grading Scale</CardTitle>
            <CardDescription>
              Grade bands used across Examination report cards and result publishing.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={openAddGrade}>
            <PlusIcon data-icon="inline-start" />
            Add Grade Band
          </Button>
        </CardHeader>
        <CardContent>
          {sortedGrades.length === 0 ? (
            <EmptyState icon={GraduationCapIcon} title="No grade bands yet" description="Add your first grade band." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade Label</TableHead>
                  <TableHead>Min %</TableHead>
                  <TableHead>Max %</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.label}</TableCell>
                    <TableCell>{grade.minPercent}%</TableCell>
                    <TableCell>{grade.maxPercent}%</TableCell>
                    <TableCell>{grade.remark}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditGrade(grade)}>
                          <PencilIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeletingGrade(grade)}>
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTerm ? "Edit Term" : "Add Term"}</DialogTitle>
            <DialogDescription>Terms divide the academic session for reporting and exams.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveTerm} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="termName">Term name</FieldLabel>
                <Input
                  id="termName"
                  required
                  value={termForm.name}
                  onChange={(e) => setTermForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="termStart">Start date</FieldLabel>
                  <Input
                    id="termStart"
                    type="date"
                    required
                    value={termForm.startDate}
                    onChange={(e) => setTermForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="termEnd">End date</FieldLabel>
                  <Input
                    id="termEnd"
                    type="date"
                    required
                    value={termForm.endDate}
                    onChange={(e) => setTermForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </Field>
              </div>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTermDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingTerm ? "Save Changes" : "Add Term"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGrade ? "Edit Grade Band" : "Add Grade Band"}</DialogTitle>
            <DialogDescription>Used to compute grades from percentage marks in Examinations.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveGrade} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="gradeLabel">Grade label</FieldLabel>
                <Input
                  id="gradeLabel"
                  required
                  value={gradeForm.label}
                  onChange={(e) => setGradeForm((f) => ({ ...f, label: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="minPercent">Min %</FieldLabel>
                  <Input
                    id="minPercent"
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={gradeForm.minPercent}
                    onChange={(e) => setGradeForm((f) => ({ ...f, minPercent: Number(e.target.value) || 0 }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="maxPercent">Max %</FieldLabel>
                  <Input
                    id="maxPercent"
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={gradeForm.maxPercent}
                    onChange={(e) => setGradeForm((f) => ({ ...f, maxPercent: Number(e.target.value) || 0 }))}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="remark">Remark</FieldLabel>
                <Input
                  id="remark"
                  required
                  value={gradeForm.remark}
                  onChange={(e) => setGradeForm((f) => ({ ...f, remark: e.target.value }))}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingGrade ? "Save Changes" : "Add Grade Band"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingTerm}
        onOpenChange={(open) => !open && setDeletingTerm(null)}
        title="Delete term?"
        description={`This will permanently remove the "${deletingTerm?.name}" term.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDeleteTerm}
      />

      <ConfirmDialog
        open={!!deletingGrade}
        onOpenChange={(open) => !open && setDeletingGrade(null)}
        title="Delete grade band?"
        description={`This will permanently remove the "${deletingGrade?.label}" grade band.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDeleteGrade}
      />
    </div>
  )
}
