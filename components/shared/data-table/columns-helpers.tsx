"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        data-row-click-ignore
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        data-row-click-ignore
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

export interface RowAction<TData> {
  label: string
  icon?: LucideIcon
  onSelect: (row: TData) => void
  variant?: "default" | "destructive"
  hidden?: (row: TData) => boolean
  separatorBefore?: boolean
}

export function createActionsColumn<TData>(actions: RowAction<TData>[]): ColumnDef<TData, unknown> {
  return {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const visibleActions = actions.filter((a) => !a.hidden?.(row.original))
      if (visibleActions.length === 0) return null
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" data-row-click-ignore />}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">Open menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-row-click-ignore>
            {visibleActions.map((action, i) => (
              <div key={action.label}>
                {action.separatorBefore && i > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  variant={action.variant}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onSelect(row.original)
                  }}
                >
                  {action.icon ? <action.icon /> : null}
                  {action.label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  }
}
