"use client";
import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

export type DataTableProps<T> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function DataTable<T>({ columns, data, total, page, pageSize, isLoading, isError, onRefresh, onPageChange, onPageSizeChange }: DataTableProps<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize || 10)));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            className="inline-flex items-center rounded border px-3 py-1 text-sm disabled:opacity-50"
            onClick={onRefresh}
            aria-label="Refresh data"
            disabled={!!isLoading}
          >
            Refresh
          </button>
        )}
        {isLoading && <span className="text-sm text-muted-foreground">Loading…</span>}
        {isError && <span className="text-sm text-red-600">Error loading data</span>}
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2 text-left font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={columns.length}>No data</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">Page {page} of {totalPages} • {total} total</div>
        <div className="flex items-center gap-2">
          <button
            className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            aria-label="Previous page"
            aria-disabled={page <= 1}
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            Prev
          </button>
          <button
            className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            aria-label="Next page"
            aria-disabled={page >= totalPages}
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
          </button>
          <label htmlFor="page-size-select" className="sr-only">Rows per page</label>
          <select
            id="page-size-select"
            aria-label="Rows per page"
            className="rounded border px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
