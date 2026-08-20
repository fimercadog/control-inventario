"use client";

import { useRef, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import { useLegacyTable as useReactTable, type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import type { RowData } from "@tanstack/table-core";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileText, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { downloadTableCsv, downloadTablePdf } from "@/lib/utils/table-export";
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
  /** Exports the visible table rows. Modules with server-side exports opt out. */
  showExports?: boolean;
  exportTitle?: string;
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
  showExports = true,
  exportTitle = "Tabla",
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: totalPages,
  });

  const rows = table.getRowModel().rows;
  const startNumber = (page - 1) * pageSize + 1;
  const endNumber = Math.min(page * pageSize, totalRows);
  const safeTotalPages = Math.max(totalPages, 1);
  const [pageInput, setPageInput] = useState(String(page));
  const [syncedPage, setSyncedPage] = useState(page);
  const tableRef = useRef<HTMLTableElement>(null);

  // Reset the editable page input whenever `page` changes externally (prev/next,
  // filters resetting to page 1, etc). Adjusting state during render — not in an
  // effect — per https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes.
  if (page !== syncedPage) {
    setSyncedPage(page);
    setPageInput(String(page));
  }

  function goToTypedPage() {
    const requested = Number(pageInput);
    if (!Number.isInteger(requested)) {
      setPageInput(String(page));
      return;
    }
    onPageChange(Math.min(Math.max(requested, 1), safeTotalPages));
  }

  return (
    <div className="flex flex-col gap-4">
      {showExports ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={isLoading || rows.length === 0} onClick={() => tableRef.current && downloadTableCsv(tableRef.current, exportTitle)}>
            <Download className="size-4" /> CSV
          </Button>
          <Button size="sm" variant="outline" disabled={isLoading || rows.length === 0} onClick={() => tableRef.current && downloadTablePdf(tableRef.current, exportTitle)}>
            <FileText className="size-4" /> PDF
          </Button>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table ref={tableRef}>
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
            ? `Mostrando ${startNumber}–${endNumber} de ${totalRows} resultado${totalRows === 1 ? "" : "s"}`
            : null}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
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
              onClick={() => onPageChange(1)}
              aria-label="Primera página"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <label className="flex items-center gap-1 px-1 text-sm text-muted-foreground">
              <span className="sr-only">Ir a página</span>
              <Input
                type="number"
                min="1"
                max={safeTotalPages}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={goToTypedPage}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                disabled={isLoading}
                className="h-8 w-14 px-2 text-center"
                aria-label="Ir a página"
              />
              <span>de {safeTotalPages}</span>
            </label>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(safeTotalPages)}
              aria-label="Última página"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
