"use client"

import type { Table } from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const selected = table.getFilteredSelectedRowModel().rows.length
  const total = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">
        {selected > 0
          ? `${selected} of ${total} row(s) selected.`
          : `${total} row${total === 1 ? "" : "s"} total.`}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
