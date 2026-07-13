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
import { Spinner } from "@/components/ui/spinner"
import { useLogActivity } from "@/lib/data/audit"
import type { Book } from "@/lib/data/types"

interface BookFormValues {
  title: string
  author: string
  isbn: string
  category: string
  totalCopies: string
  availableCopies: string
  shelfLocation: string
}

const EMPTY_FORM: BookFormValues = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  totalCopies: "1",
  availableCopies: "1",
  shelfLocation: "",
}

function bookToForm(b: Book): BookFormValues {
  return {
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    category: b.category,
    totalCopies: String(b.totalCopies),
    availableCopies: String(b.availableCopies),
    shelfLocation: b.shelfLocation,
  }
}

interface BookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: Book
  onSubmit: (book: Book) => void
}

export function BookFormDialog({ open, onOpenChange, book, onSubmit }: BookFormDialogProps) {
  const logActivity = useLogActivity()
  const [values, setValues] = useState<BookFormValues>(EMPTY_FORM)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(book ? bookToForm(book) : EMPTY_FORM)
    }
  }, [open, book])

  function set<K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim() || !values.author.trim()) {
      toast.error("Please fill in the title and author.")
      return
    }
    setPending(true)

    const total = Number(values.totalCopies) || 1
    const available = Math.min(Number(values.availableCopies) || 0, total)

    const base = book
    const result: Book = {
      id: base?.id ?? `bk_new_${Date.now()}`,
      title: values.title,
      author: values.author,
      isbn: values.isbn,
      category: values.category,
      totalCopies: total,
      availableCopies: available,
      status: base?.status ?? "active",
      shelfLocation: values.shelfLocation,
    }

    setTimeout(() => {
      onSubmit(result)
      logActivity({
        action: base ? "update" : "create",
        module: "Library",
        entityType: "Book",
        entityId: result.id,
        description: `${base ? "Updated" : "Added"} book ${result.title}`,
      })
      toast.success(base ? "Book updated" : "Book added", { description: result.title })
      setPending(false)
      onOpenChange(false)
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{book ? "Edit Book" : "Add Book"}</DialogTitle>
          <DialogDescription>
            {book ? "Update this book's catalog details." : "Add a new title to the library catalog."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input id="title" required value={values.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="author">Author</FieldLabel>
                <Input id="author" required value={values.author} onChange={(e) => set("author", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="isbn">ISBN</FieldLabel>
                <Input id="isbn" value={values.isbn} onChange={(e) => set("isbn", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Input id="category" value={values.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="shelfLocation">Shelf location</FieldLabel>
                <Input id="shelfLocation" value={values.shelfLocation} onChange={(e) => set("shelfLocation", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="totalCopies">Total copies</FieldLabel>
                <Input
                  id="totalCopies"
                  type="number"
                  min={1}
                  value={values.totalCopies}
                  onChange={(e) => set("totalCopies", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="availableCopies">Available copies</FieldLabel>
                <Input
                  id="availableCopies"
                  type="number"
                  min={0}
                  value={values.availableCopies}
                  onChange={(e) => set("availableCopies", e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {book ? "Save Changes" : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
