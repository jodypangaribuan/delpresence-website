"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "./button"
import { Input } from "./input"
import { Filter, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchColumn?: string
  searchPlaceholder?: string
  filterColumn?: string
  filterOptions?: { value: string; label: string }[]
  filterPlaceholder?: string
  showFilterByDefault?: boolean
}

export function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder = "Cari...",
  filterColumn,
  filterOptions = [],
  filterPlaceholder = "Filter",
  showFilterByDefault = true,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 py-4">
      {searchColumn && (
        <div className="relative w-full sm:max-w-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="w-full pl-10"
          />
        </div>
      )}

      <div className="flex gap-3 ml-auto">
        {filterColumn && filterOptions.length > 0 && showFilterByDefault && (
          <Select
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onValueChange={(value) => {
              table.getColumn(filterColumn)?.setFilterValue(value === "all" ? "" : value)
            }}
          >
            <SelectTrigger className="min-w-[180px] w-auto">
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
} 