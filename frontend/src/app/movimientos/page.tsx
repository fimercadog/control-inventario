"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MovimientoForm } from "@/components/forms/movimiento-form";
import { MovimientoDetailDialog } from "@/app/movimientos/movimiento-detail-dialog";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchMovimientos } from "@/lib/api/movimientos";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { Movimiento, MovimientosQueryParams, TipoMovimiento } from "@/types/movimiento";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 100; // matches MovimientoController::index's real default

const TIPO_LABEL: Record<string, string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" };
const TIPO_BADGE: Record<string, "success" | "destructive" | "warning"> = {
  entrada: "success",
  salida: "destructive",
  ajuste: "warning",
};
const TIPO_ICON: Record<string, typeof ArrowDownLeft> = {
  entrada: ArrowDownLeft,
  salida: ArrowUpRight,
  ajuste: SlidersHorizontal,
};

interface QueryState {
  searchTerm: string;
  tipo: TipoMovimiento | "todos";
  page: number;
  nonce: number;
}

function buildQueryKey(query: QueryState): string {
  return JSON.stringify(query);
}

interface MovimientosResult {
  key: string;
  movimientos: Movimiento[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: MovimientosResult = { key: "", movimientos: [], meta: null, error: null };

export default function MovimientosPage() {
  const canView = usePermission("movimientos.ver");
  const canCreate = usePermission("movimientos.crear");
  // MovimientoPolicy::update() no exige un permiso propio — solo pertenencia a la empresa
  // (confirmado contra el Policy real: no existe movimientos.editar en el catálogo, decisión
  // de negocio deliberada). movimientos.ver es el proxy más cercano: quien no puede ni ver el
  // módulo no debería poder editar su metadata tampoco.
  const canEditMetadata = canView;

  const { inputValue: searchInput, setInputValue: setSearchInput, searchTerm } = useDebouncedSearch();
  const [tipo, setTipo] = useState<TipoMovimiento | "todos">("todos");
  const [page, setPage] = useState(1);
  const [refetchNonce, setRefetchNonce] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Movimiento | null>(null);

  const filtersSignature = `${searchTerm}|${tipo}`;
  const [appliedFiltersSignature, setAppliedFiltersSignature] = useState(filtersSignature);
  if (filtersSignature !== appliedFiltersSignature) {
    setAppliedFiltersSignature(filtersSignature);
    setPage(1);
  }

  const query: QueryState = { searchTerm, tipo, page, nonce: refetchNonce };
  const queryKey = buildQueryKey(query);

  const [result, setResult] = useState<MovimientosResult>(EMPTY_RESULT);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, tipo, page, nonce: refetchNonce });
    const params: MovimientosQueryParams = {
      busqueda: searchTerm || undefined,
      tipo: tipo !== "todos" ? tipo : undefined,
      per_page: DEFAULT_PAGE_SIZE,
      page,
    };
    fetchMovimientos(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, movimientos: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          movimientos: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar los movimientos."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, tipo, page, refetchNonce]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  function handleCreated() {
    setCreateOpen(false);
    setRefetchNonce((n) => n + 1);
  }

  function handleUpdated(updated: Movimiento) {
    setSelected(null);
    setResult((prev) => ({
      ...prev,
      movimientos: prev.movimientos.map((m) => (m.id === updated.id ? updated : m)),
    }));
  }

  if (!canView) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>No tienes permiso para ver este módulo.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            Historial de entradas, salidas y ajustes de inventario. Un movimiento nunca se elimina.
          </p>
        </div>

        {canCreate ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button />
              }
            >
              <Plus className="size-4" />
              Nuevo Movimiento
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Movimiento</DialogTitle>
              </DialogHeader>
              <MovimientoForm onSuccess={handleCreated} />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por documento, producto o código…"
            className="pl-9"
            aria-label="Buscar movimientos"
          />
        </div>

        <Select value={tipo} onValueChange={(value) => setTipo((value as TipoMovimiento | "todos") ?? "todos")}>
          <SelectTrigger className="w-40" aria-label="Filtrar por tipo">
            <SelectValue>{(value: string) => (value === "todos" ? "Todos los tipos" : TIPO_LABEL[value])}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="salida">Salida</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
        </div>
      ) : result.movimientos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No se encontraron movimientos.</p>
      ) : (
        <ol className="flex flex-col gap-3 border-l-2 border-border pl-4">
          {result.movimientos.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelected(m)}
                className="flex w-full flex-col gap-1 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={TIPO_BADGE[m.tipo]}>
                      {(() => {
                        const Icon = TIPO_ICON[m.tipo];
                        return Icon ? <Icon className="size-3" /> : null;
                      })()}
                      {TIPO_LABEL[m.tipo] ?? m.tipo}
                    </Badge>
                    <span className="font-medium text-foreground">{m.producto ?? "—"}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDateTime(m.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {m.delta >= 0 ? "+" : ""}
                    {m.delta} ({m.stock_anterior} → {m.stock_nuevo})
                    {m.usuario ? ` · ${m.usuario}` : ""}
                  </span>
                  {m.documento ? <span>{m.documento}</span> : null}
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}

      {result.meta && result.meta.last_page > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {result.meta.current_page} de {result.meta.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= result.meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      ) : null}

      <MovimientoDetailDialog
        movimiento={selected}
        onClose={() => setSelected(null)}
        canEditMetadata={canEditMetadata}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
