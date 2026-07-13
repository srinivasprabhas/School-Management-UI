"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { CopyIcon, EyeIcon, MegaphoneIcon, PencilIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DataTable } from "@/components/shared/data-table/data-table"
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header"
import {
  createActionsColumn,
  createSelectColumn,
  type RowAction,
} from "@/components/shared/data-table/columns-helpers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge, toneForStatus } from "@/components/shared/status-badge"
import { useAnnouncements } from "@/lib/data/store/entities"
import { useLogActivity } from "@/lib/data/audit"
import { formatDate } from "@/lib/format"
import { toISODate } from "@/lib/data/seed/random"
import { SEED_TODAY } from "@/lib/data/seed/generate"
import { MOCK_USERS } from "@/lib/rbac/mock-users"
import type { Announcement } from "@/lib/data/types"
import { AnnouncementFormSheet } from "./announcement-form-sheet"

const TYPE_LABEL: Record<Announcement["type"], string> = {
  announcement: "Announcement",
  circular: "Circular",
  newsletter: "Newsletter",
}

function buildAnnouncementColumns(args: {
  authorName: (id?: string) => string
  onPublish: (a: Announcement) => void
  onEdit: (a: Announcement) => void
  onDuplicate: (a: Announcement) => void
  onPreview: (a: Announcement) => void
  onDelete: (a: Announcement) => void
}): ColumnDef<Announcement>[] {
  const actions: RowAction<Announcement>[] = [
    {
      label: "Publish Now",
      icon: SendIcon,
      onSelect: args.onPublish,
      hidden: (a) => a.status === "published",
    },
    { label: "Edit", icon: PencilIcon, onSelect: args.onEdit },
    { label: "Duplicate", icon: CopyIcon, onSelect: args.onDuplicate },
    { label: "Preview", icon: EyeIcon, onSelect: args.onPreview },
    { label: "Delete", icon: Trash2Icon, variant: "destructive", onSelect: args.onDelete, separatorBefore: true },
  ]

  return [
    createSelectColumn<Announcement>(),
    {
      id: "title",
      accessorFn: (a) => a.title,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <MegaphoneIcon className="size-4" />
          </div>
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ getValue }) => <Badge variant="secondary">{TYPE_LABEL[getValue<Announcement["type"]>()]}</Badge>,
      filterFn: (row, id, value: string) => row.getValue(id) === value,
    },
    {
      id: "audience",
      accessorFn: (a) => a.audience.join(", "),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Audience" />,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.audience.map((a) => (
            <Badge key={a} variant="outline">
              {a}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "publishDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Publish Date" />,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: "author",
      accessorFn: (a) => args.authorName(a.authorId),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />,
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
    createActionsColumn<Announcement>(actions),
  ]
}

export function AnnouncementsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: announcements, add, update, remove } = useAnnouncements()
  const logActivity = useLogActivity()

  const [formOpen, setFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>(undefined)
  const [previewingAnnouncement, setPreviewingAnnouncement] = useState<Announcement | null>(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setEditingAnnouncement(undefined)
      setFormOpen(true)
    }
  }, [searchParams])

  const usersById = useMemo(() => new Map(MOCK_USERS.map((u) => [u.id, u.name])), [])
  const authorName = useCallback(
    (id?: string) => (id ? usersById.get(id) ?? "Staff" : "Staff"),
    [usersById]
  )

  const handleDuplicate = useCallback(
    (a: Announcement) => {
      add({ ...a, id: `ann_copy_${a.id}_${announcements.length}`, status: "draft" })
      toast.success("Notice duplicated", { description: `Copy of "${a.title}" saved as draft.` })
    },
    [add, announcements.length]
  )

  const columns = useMemo(
    () =>
      buildAnnouncementColumns({
        authorName,
        onPublish: (a) => {
          update(a.id, { status: "published", publishDate: toISODate(SEED_TODAY) })
          toast.success("Notice published")
        },
        onEdit: (a) => {
          setEditingAnnouncement(a)
          setFormOpen(true)
        },
        onDuplicate: handleDuplicate,
        onPreview: (a) => setPreviewingAnnouncement(a),
        onDelete: (a) => setDeletingAnnouncement(a),
      }),
    [authorName, update, handleDuplicate]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        description="Publish notices, circulars, and newsletters."
        actions={
          <Button
            onClick={() => {
              setEditingAnnouncement(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Create Notice
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={announcements}
        searchKey="title"
        searchPlaceholder="Search by title…"
        filters={[
          {
            columnId: "type",
            title: "Type",
            options: Object.entries(TYPE_LABEL).map(([value, label]) => ({ label, value })),
          },
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Published", value: "published" },
              { label: "Archived", value: "archived" },
            ],
          },
        ]}
        emptyTitle="No notices found"
        emptyDescription="Create your first notice to get started."
      />

      <AnnouncementFormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            const params = new URLSearchParams(searchParams.toString())
            if (params.has("action")) {
              params.delete("action")
              router.replace(`/campus-operations/announcements${params.toString() ? `?${params}` : ""}`)
            }
          }
        }}
        announcement={editingAnnouncement}
        onSubmit={(announcement) => {
          if (editingAnnouncement) update(announcement.id, announcement)
          else add(announcement)
        }}
      />

      <Dialog open={!!previewingAnnouncement} onOpenChange={(open) => !open && setPreviewingAnnouncement(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewingAnnouncement?.title}</DialogTitle>
            <DialogDescription>
              {previewingAnnouncement ? TYPE_LABEL[previewingAnnouncement.type] : ""} ·{" "}
              {formatDate(previewingAnnouncement?.publishDate)}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm text-foreground">{previewingAnnouncement?.body}</p>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingAnnouncement}
        onOpenChange={(open) => !open && setDeletingAnnouncement(null)}
        title="Delete notice?"
        description={`This will permanently remove "${deletingAnnouncement?.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingAnnouncement) return
          remove(deletingAnnouncement.id)
          logActivity({
            action: "delete",
            module: "Announcements",
            entityType: "Announcement",
            entityId: deletingAnnouncement.id,
            description: `Deleted notice ${deletingAnnouncement.title}`,
          })
          toast.success("Notice deleted")
          setDeletingAnnouncement(null)
        }}
      />
    </div>
  )
}
