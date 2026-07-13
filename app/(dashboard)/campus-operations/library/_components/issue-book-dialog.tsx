"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useLogActivity } from "@/lib/data/audit"
import { useStudents, useTeachers } from "@/lib/data/store/entities"
import { addDays, toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import type { Book, BookIssue } from "@/lib/data/types"

interface IssueBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book | null
  onIssue: (issue: BookIssue) => void
}

export function IssueBookDialog({ open, onOpenChange, book, onIssue }: IssueBookDialogProps) {
  const { items: students } = useStudents()
  const { items: teachers } = useTeachers()
  const logActivity = useLogActivity()

  const [borrower, setBorrower] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) setBorrower("")
  }, [open])

  const issueDate = toISODate(SEED_TODAY)
  const dueDate = toISODate(addDays(SEED_TODAY, 14))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!book) return
    if (!borrower) {
      toast.error("Please select a borrower.")
      return
    }
    if (book.availableCopies <= 0) {
      toast.error("No copies available to issue.")
      return
    }
    setPending(true)

    const [borrowerType, borrowerId] = borrower.split(":") as [BookIssue["borrowerType"], string]
    const result: BookIssue = {
      id: `iss_new_${Date.now()}`,
      bookId: book.id,
      borrowerId,
      borrowerType,
      issueDate,
      dueDate,
      status: "issued",
      fineAmount: 0,
    }

    setTimeout(() => {
      onIssue(result)
      logActivity({
        action: "create",
        module: "Library",
        entityType: "BookIssue",
        entityId: result.id,
        description: `Issued "${book.title}" to ${borrowerType}`,
      })
      toast.success("Book issued", { description: `Due back ${dueDate}` })
      setPending(false)
      onOpenChange(false)
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>{book?.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="borrower">Borrower</FieldLabel>
              <Select value={borrower} onValueChange={(v) => setBorrower(v ?? "")}>
                <SelectTrigger id="borrower" className="w-full">
                  <SelectValue placeholder="Search for a student or teacher…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Students</SelectLabel>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={`student:${s.id}`}>
                        {s.firstName} {s.lastName} — Roll {s.rollNo}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Teachers</SelectLabel>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={`staff:${t.id}`}>
                        {t.firstName} {t.lastName} — {t.designation}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="issueDate">Issue date</FieldLabel>
                <Input id="issueDate" value={issueDate} disabled />
              </Field>
              <Field>
                <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
                <Input id="dueDate" value={dueDate} disabled />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Issue Book
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
