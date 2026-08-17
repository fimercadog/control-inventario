"use client";

import { flexRender } from "@tanstack/react-table";
import { useLegacyTable as useReactTable, type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import type { RowData } from "@tanstack/table-core";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  /** 1-based current page, as used by the backend. */
  page: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Renders numbered rows (§15): visual only, never sent to the backend. */
  withRowNumber?: boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  emptyMessage = "No hay resultados.",
  page,
  pageSize,
  totalPages,
  totalRows,
  onPageChange,
  onPageSizeChange,
  withRowNumber = true,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: totalPages,
  });

  const rows = table.getRowModel().rows;
  const startNumber = (page - 1) * pageSize + 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {withRowNumber ? <TableHead className="w-12">#</TableHead> : null}
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (withRowNumber ? 1 : 0)}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando…
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length + (withRowNumber ? 1 : 0)} className="p-4">
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>
                      {errorMessage ?? "Ocurrió un error al cargar los datos."}
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (withRowNumber ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.id}>
                  {withRowNumber ? (
                    <TableCell className="text-muted-foreground">{startNumber + index}</TableCell>
                  ) : null}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {totalRows > 0
            ? `${totalRows} resultado${totalRows === 1 ? "" : "s"} · página ${page} de ${Math.max(totalPages, 1)}`
            : null}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filas por página</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => value && onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20" aria-label="Filas por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
