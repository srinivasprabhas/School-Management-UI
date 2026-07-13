"use client"

import type { Table } from "@tanstack/react-table"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableViewOptions } from "./data-table-view-options"

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilterDef {
  columnId: string
  title: string
  options: DataTableFilterOption[]
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  filters?: DataTableFilterDef[]
  actions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search…",
  filters,
  actions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchKey ? (
          <InputGroup className="h-8 max-w-xs">
            <InputGroupInput
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
          </InputGroup>
        ) : null}
        {filters?.map((filter) => {
          const column = table.getColumn(filter.columnId)
          if (!column) return null
          const value = (column.getFilterValue() as string) ?? "all"
          return (
            <Select
              key={filter.columnId}
              value={value}
              onValueChange={(v) => column.setFilterValue(v === "all" ? undefined : v)}
            >
              <SelectTrigger size="sm" className="h-8">
                <SelectValue placeholder={filter.title} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.title}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        })}
        {isFiltered ? (
          <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
            Reset
            <XIcon data-icon="inline-end" />
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
