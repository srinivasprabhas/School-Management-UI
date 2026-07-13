"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  BookIcon,
  BookmarkPlusIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { useBookIssues, useBooks } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import type { Book, BookIssue } from "@/lib/data/types"
import { BookFormDialog } from "./book-form-dialog"
import { IssueBookDialog } from "./issue-book-dialog"

function buildCatalogColumns(args: {
  onIssue: (b: Book) => void
  onReserve: (b: Book) => void
  onEdit: (b: Book) => void
  onDelete: (b: Book) => void
}): ColumnDef<Book>[] {
  const actions: RowAction<Book>[] = [
    { label: "Issue", icon: SendIcon, onSelect: args.onIssue, hidden: (b) => b.availableCopies <= 0 },
    { label: "Reserve", icon: BookmarkPlusIcon, onSelect: args.onReserve },
    { label: "Edit", icon: PencilIcon, onSelect: args.onEdit, separatorBefore: true },
    { label: "Delete", icon: Trash2Icon, variant: "destructive", onSelect: args.onDelete },
  ]

  return [
    createSelectColumn<Book>(),
    {
      id: "book",
      accessorFn: (b) => b.title,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Book" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <BookIcon className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">{row.original.author}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    },
    {
      accessorKey: "isbn",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ISBN" />,
    },
    {
      id: "copies",
      accessorFn: (b) => b.availableCopies,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Copies" />,
      cell: ({ row }) => (
        <span>
          {row.original.availableCopies}/{row.original.totalCopies}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return <StatusBadge label={status} tone={toneForStatus(status)} className="capitalize" />
      },
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    createActionsColumn<Book>(actions),
  ]
}

export function CatalogPanel() {
  const { items: books, add, update, remove } = useBooks()
  const { add: addIssue } = useBookIssues()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined)
  const [issuingBook, setIssuingBook] = useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = useState<Book | null>(null)

  const columns = useMemo(
    () =>
      buildCatalogColumns({
        onIssue: (b) => setIssuingBook(b),
        onReserve: (b) =>
          toast.success("Reservation placed", {
            description: `${b.title} has been reserved. We'll notify you when it's available.`,
          }),
        onEdit: (b) => {
          setEditingBook(b)
          setFormOpen(true)
        },
        onDelete: (b) => setDeletingBook(b),
      }),
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={books}
        searchKey="book"
        searchPlaceholder="Search by title or author…"
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        toolbarActions={
          <Button
            onClick={() => {
              setEditingBook(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add Book
          </Button>
        }
        emptyTitle="No books found"
        emptyDescription="Add your first title to the catalog."
      />

      <BookFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        book={editingBook}
        onSubmit={(book) => {
          if (editingBook) update(book.id, book)
          else add(book)
        }}
      />

      <IssueBookDialog
        open={!!issuingBook}
        onOpenChange={(open) => !open && setIssuingBook(null)}
        book={issuingBook}
        onIssue={(issue: BookIssue) => {
          addIssue(issue)
          update(issue.bookId, { availableCopies: Math.max(0, (issuingBook?.availableCopies ?? 1) - 1) })
        }}
      />

      <ConfirmDialog
        open={!!deletingBook}
        onOpenChange={(open) => !open && setDeletingBook(null)}
        title="Delete book?"
        description={`This will permanently remove "${deletingBook?.title}" from the catalog. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingBook) return
          remove(deletingBook.id)
          logActivity({
            action: "delete",
            module: "Library",
            entityType: "Book",
            entityId: deletingBook.id,
            description: `Deleted book ${deletingBook.title}`,
          })
          toast.success("Book deleted")
          setDeletingBook(null)
        }}
      />
    </div>
  )
}
