"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { buildProductoColumns } from "@/app/productos/columns";
import { ProductoForm } from "@/components/forms/producto-form";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchProductos, habilitarProducto, deshabilitarProducto } from "@/lib/api/productos";
import { fetchCategorias } from "@/lib/api/categorias";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Producto, ProductosQueryParams } from "@/types/producto";
import type { Categoria } from "@/types/categoria";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 100; // matches ProductoController::index's real default

interface QueryState {
  searchTerm: string;
  estado: "activo" | "todos";
  categoriaId: string;
  pageSize: number;
  page: number;
  nonce: number;
}

function buildQueryKey(query: QueryState): string {
  return JSON.stringify(query);
}

interface ProductosResult {
  key: string;
  productos: Producto[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: ProductosResult = { key: "", productos: [], meta: null, error: null };

export default function ProductosPage() {
  const canView = usePermission("productos.ver");
  const canCreate = usePermission("productos.crear");
  // ProductoPolicy::update() (productos.editar) gates Habilitar; ::delete()
  // (productos.gestionar) gates Deshabilitar only — same asymmetry as the rest of the ERP.
  const canEdit = usePermission("productos.editar");
  const canDisable = usePermission("productos.gestionar");

  const { inputValue: searchInput, setInputValue: setSearchInput, searchTerm } = useDebouncedSearch();
  const [estado, setEstado] = useState<"activo" | "todos">("activo");
  const [categoriaId, setCategoriaId] = useState<string>("todas");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refetchNonce, setRefetchNonce] = useState(0);

  useEffect(() => {
    fetchCategorias({ estado: "activo", per_page: 100 }).then((d) => setCategorias(d.items)).catch(() => {});
  }, []);

  const filtersSignature = `${searchTerm}|${estado}|${categoriaId}`;
  const [appliedFiltersSignature, setAppliedFiltersSignature] = useState(filtersSignature);
  if (filtersSignature !== appliedFiltersSignature) {
    setAppliedFiltersSignature(filtersSignature);
    setPage(1);
  }

  const query: QueryState = { searchTerm, estado, categoriaId, pageSize, page, nonce: refetchNonce };
  const queryKey = buildQueryKey(query);

  const [result, setResult] = useState<ProductosResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, estado, categoriaId, pageSize, page, nonce: refetchNonce });
    const params: ProductosQueryParams = {
      busqueda: searchTerm || undefined,
      estado,
      categoria_id: categoriaId !== "todas" ? Number(categoriaId) : undefined,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchProductos(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, productos: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          productos: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar los productos."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, estado, categoriaId, pageSize, page, refetchNonce]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleEstado(producto: Producto) {
    setTogglingId(producto.id);
    setToggleError(null);
    try {
      if (producto.estado === "activo") {
        await deshabilitarProducto(producto.id);
      } else {
        await habilitarProducto(producto.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado del producto."));
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setRefetchNonce((n) => n + 1);
  }

  const columns = buildProductoColumns({ canEdit, canDisable, togglingId, onToggleEstado: handleToggleEstado });

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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">Gestiona el catálogo de productos de tu empresa.</p>
        </div>

        {canCreate ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" />
              }
            >
              <Plus className="size-4" />
              Nuevo Producto
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Producto</DialogTitle>
                <DialogDescription>
                  El stock inicial es 0 — regístralo desde la ficha del producto después de crearlo.
                </DialogDescription>
              </DialogHeader>
              <ProductoForm onSuccess={handleCreated} />
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
            placeholder="Buscar por nombre o marca…"
            className="pl-9"
            aria-label="Buscar productos"
          />
        </div>

        <Select value={categoriaId} onValueChange={(value) => setCategoriaId(value ?? "todas")}>
          <SelectTrigger className="w-48" aria-label="Filtrar por categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estado} onValueChange={(value) => setEstado((value as "activo" | "todos") ?? "activo")}>
          <SelectTrigger className="w-40" aria-label="Filtrar por estado">
            <SelectValue>{(value: string) => (value === "activo" ? "Activos" : "Todos")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {toggleError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{toggleError}</AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={columns}
        data={result.productos}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron productos."
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
    </div>
  );
}
