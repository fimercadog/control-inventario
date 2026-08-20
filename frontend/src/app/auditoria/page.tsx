"use client";

import { useEffect, useState } from "react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { AuditLogDetailDialog, ResultadoBadge } from "@/app/auditoria/audit-log-detail-dialog";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchAuditLog } from "@/lib/api/audit-log";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { AuditLogEntry, AuditLogQueryParams } from "@/types/audit-log";

const DEFAULT_PAGE_SIZE = 25; // matches AuditLogController::index's real default

interface QueryState {
  searchTerm: string;
  modulo: string;
  accion: string;
  desde: string;
  hasta: string;
  pageSize: number;
  page: number;
}

function buildQueryKey(query: QueryState): string {
  return JSON.stringify(query);
}

interface AuditResult {
  key: string;
  items: AuditLogEntry[];
  total: number;
  lastPage: number;
  modulos: string[];
  acciones: string[];
  error: string | null;
}

const EMPTY_RESULT: AuditResult = { key: "", items: [], total: 0, lastPage: 1, modulos: [], acciones: [], error: null };

export default function AuditoriaPage() {
  const canView = usePermission("auditoria.ver");

  const { inputValue: searchInput, setInputValue: setSearchInput, searchTerm } = useDebouncedSearch();
  const [modulo, setModulo] = useState("todos");
  const [accion, setAccion] = useState("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const filtersSignature = `${searchTerm}|${modulo}|${accion}|${desde}|${hasta}`;
  const [appliedFiltersSignature, setAppliedFiltersSignature] = useState(filtersSignature);
  if (filtersSignature !== appliedFiltersSignature) {
    setAppliedFiltersSignature(filtersSignature);
    setPage(1);
  }

  const query: QueryState = { searchTerm, modulo, accion, desde, hasta, pageSize, page };
  const queryKey = buildQueryKey(query);

  const [result, setResult] = useState<AuditResult>(EMPTY_RESULT);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, modulo, accion, desde, hasta, pageSize, page });
    const params: AuditLogQueryParams = {
      busqueda: searchTerm || undefined,
      modulo: modulo !== "todos" ? modulo : undefined,
      accion: accion !== "todas" ? accion : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchAuditLog(params)
      .then((data) => {
        if (ignore) return;
        setResult({
          key,
          items: data.items,
          total: data.meta.total,
          lastPage: data.meta.last_page,
          modulos: data.meta.modulos_disponibles,
          acciones: data.meta.acciones_disponibles,
          error: null,
        });
      })
      .catch((error) => {
        if (ignore) return;
        setResult((prev) => ({
          ...prev,
          key,
          items: [],
          error: extractApiErrorMessage(error, "No se pudo cargar la auditoría."),
        }));
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, modulo, accion, desde, hasta, pageSize, page]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  const columns: ColumnDef<AuditLogEntry, unknown>[] = [
    {
      accessorKey: "created_at",
      header: "Fecha",
      cell: ({ row }) => (
        <Button variant="link" className="h-auto justify-start p-0 text-left font-normal" onClick={() => setSelected(row.original)}>
          {formatDateTime(row.original.created_at)}
        </Button>
      ),
    },
    { accessorKey: "modulo", header: "Módulo" },
    { accessorKey: "accion", header: "Acción" },
    { accessorKey: "usuario", header: "Usuario", cell: ({ row }) => row.original.usuario?.email ?? "—" },
    {
      accessorKey: "resultado",
      header: "Resultado",
      cell: ({ row }) => <ResultadoBadge resultado={row.original.resultado} />,
    },
  ];

  if (!canView) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>No tienes permiso para ver este módulo.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Historial de acciones importantes del sistema — quién hizo qué y cuándo. Solo lectura.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar…"
            className="pl-9"
            aria-label="Buscar en auditoría"
          />
        </div>

        <Select value={modulo} onValueChange={(v) => setModulo(v ?? "todos")}>
          <SelectTrigger className="w-40" aria-label="Filtrar por módulo">
            <SelectValue placeholder="Todos los módulos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los módulos</SelectItem>
            {result.modulos.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={accion} onValueChange={(v) => setAccion(v ?? "todas")}>
          <SelectTrigger className="w-44" aria-label="Filtrar por acción">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las acciones</SelectItem>
            {result.acciones.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" aria-label="Desde" />
        <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" aria-label="Hasta" />
      </div>

      <DataTable
        columns={columns}
        data={result.items}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron eventos de auditoría."
        page={page}
        pageSize={pageSize}
        totalPages={result.lastPage}
        totalRows={result.total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <AuditLogDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
