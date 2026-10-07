import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "cn"

/**
 * C15 — Data Table
 * §4 C15: Header row 40, Label style; rows 56/40; zebra off; hover row lav-50;
 * sticky header; numeric columns right-aligned, tabular.
 */

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  className?: string
  density?: "comfortable" | "compact"
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  density = "comfortable"
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className={cn("rounded-card border border-border-strong overflow-hidden bg-surface", className)} data-slot="data-table">
      <Table>
        <TableHeader className="bg-surface sticky top-0 z-10 border-b border-border-strong">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="h-10 hover:bg-transparent border-none">
              {headerGroup.headers.map((header) => {
                const isNumeric = (header.column.columnDef.meta as { isNumeric?: boolean })?.isNumeric
                return (
                  <TableHead 
                    key={header.id}
                    className={cn(
                      "text-label text-ink-muted px-4 h-10",
                      isNumeric && "text-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "border-b border-border/50 hover:bg-hover-row transition-colors group",
                  density === "compact" ? "h-10" : "h-14",
                  row.getIsSelected() && "bg-selected-row"
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const isNumeric = (cell.column.columnDef.meta as { isNumeric?: boolean })?.isNumeric
                  return (
                    <TableCell 
                      key={cell.id}
                      className={cn(
                        "px-4 text-body text-ink align-middle",
                        isNumeric && "text-right tabular-nums font-mono text-[13px]"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-ink-muted text-body">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
