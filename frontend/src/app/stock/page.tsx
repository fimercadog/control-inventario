"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { buildStockColumns } from "@/app/stock/columns";
import { StockForm } from "@/components/forms/stock-form";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchStock, habilitarStock, deshabilitarStock } from "@/lib/api/stock";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { StockItem, StockQueryParams } from "@/types/stock";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 100; // matches StockController::index's real default

interface QueryState {
  searchTerm: string;
  estado: "activo" | "todos";
  bajoMinimo: boolean;
  pageSize: number;
  page: number;
  nonce: number;
}

function buildQueryKey(query: QueryState): string {
  return JSON.stringify(query);
}

interface StockResult {
  key: string;
  items: StockItem[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: StockResult = { key: "", items: [], meta: null, error: null };

export default function StockPage() {
  const canView = usePermission("stock.ver");
  // StockPolicy::update() (stock.editar) gates both Editar and Habilitar;
  // ::delete() (stock.gestionar) gates Deshabilitar only — same asymmetry as the rest of the ERP.
  const canEdit = usePermission("stock.editar");
  const canDisable = usePermission("stock.gestionar");

  const { inputValue: searchInput, setInputValue: setSearchInput, searchTerm } = useDebouncedSearch();
  const [estado, setEstado] = useState<"activo" | "todos">("activo");
  const [bajoMinimo, setBajoMinimo] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refetchNonce, setRefetchNonce] = useState(0);

  const filtersSignature = `${searchTerm}|${estado}|${bajoMinimo}`;
  const [appliedFiltersSignature, setAppliedFiltersSignature] = useState(filtersSignature);
  if (filtersSignature !== appliedFiltersSignature) {
    setAppliedFiltersSignature(filtersSignature);
    setPage(1);
  }

  const query: QueryState = { searchTerm, estado, bajoMinimo, pageSize, page, nonce: refetchNonce };
  const queryKey = buildQueryKey(query);

  const [result, setResult] = useState<StockResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, estado, bajoMinimo, pageSize, page, nonce: refetchNonce });
    const params: StockQueryParams = {
      busqueda: searchTerm || undefined,
      estado,
      bajo_minimo: bajoMinimo || undefined,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchStock(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, items: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({ key, items: [], meta: null, error: extractApiErrorMessage(error, "No se pudo cargar el stock.") });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, estado, bajoMinimo, pageSize, page, refetchNonce]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleEstado(item: StockItem) {
    setTogglingId(item.id);
    setToggleError(null);
    try {
      if (item.estado === "activo") {
        await deshabilitarStock(item.id);
      } else {
        await habilitarStock(item.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado del stock."));
    } finally {
      setTogglingId(null);
    }
  }

  function handleEdited() {
    setEditingItem(null);
    setRefetchNonce((n) => n + 1);
  }

  const columns = buildStockColumns({
    canEdit,
    canDisable,
    togglingId,
    onEdit: setEditingItem,
    onToggleEstado: handleToggleEstado,
  });

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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stock</h1>
        <p className="text-sm text-muted-foreground">
          Consulta el stock actual y define los umbrales de alerta de cada producto.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o código…"
            className="pl-9"
            aria-label="Buscar en stock"
          />
        </div>

        <Select value={estado} onValueChange={(value) => setEstado((value as "activo" | "todos") ?? "activo")}>
          <SelectTrigger className="w-40" aria-label="Filtrar por estado">
            <SelectValue>{(value: string) => (value === "activo" ? "Activos" : "Todos")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={bajoMinimo} onCheckedChange={(checked) => setBajoMinimo(checked === true)} />
          Solo bajo mínimo
        </label>
      </div>

      {toggleError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{toggleError}</AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={columns}
        data={result.items}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron productos en stock."
        page={result.meta?.current_page ?? page}
        pageSize={result.meta?.per_page ?? pageSize}
        totalPages={result.meta?.last_page ?? 1}
        totalRows={result.meta?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Umbrales de stock — {editingItem?.nombre}</DialogTitle>
            <DialogDescription>El stock actual es de solo lectura; solo se editan los umbrales.</DialogDescription>
          </DialogHeader>
          {editingItem ? <StockForm item={editingItem} onSuccess={handleEdited} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
