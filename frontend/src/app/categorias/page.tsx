"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
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
import { buildCategoriaColumns } from "@/app/categorias/columns";
import { CategoriaViewDialog } from "@/app/categorias/categoria-view-dialog";
import { CategoriaForm } from "@/components/forms/categoria-form";
import { useCategoriaDetail } from "@/hooks/use-categoria-detail";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchCategorias, habilitarCategoria, deshabilitarCategoria } from "@/lib/api/categorias";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Categoria, CategoriasQueryParams } from "@/types/categoria";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 100; // matches CategoriaController::index's real default

interface QueryState {
  searchTerm: string;
  estado: "activo" | "todos";
  pageSize: number;
  page: number;
  nonce: number;
}

function buildQueryKey(query: QueryState): string {
  return JSON.stringify(query);
}

interface CategoriasResult {
  key: string;
  categorias: Categoria[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: CategoriasResult = { key: "", categorias: [], meta: null, error: null };

export default function CategoriasPage() {
  const canView = usePermission("categorias.ver");
  const canCreate = usePermission("categorias.crear");
  // CategoriaPolicy::update() (categorias.editar) gates both Editar and Habilitar;
  // ::delete() (categorias.gestionar) gates Deshabilitar only — a real, deliberate
  // asymmetry, not the single roles.gestionar-style gate Roles uses.
  const canEdit = usePermission("categorias.editar");
  const canDisable = usePermission("categorias.gestionar");

  const { inputValue: searchInput, setInputValue: setSearchInput, searchTerm } =
    useDebouncedSearch();
  const [estado, setEstado] = useState<"activo" | "todos">("activo");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refetchNonce, setRefetchNonce] = useState(0);

  // Resets to page 1 whenever a filter changes, without a synchronous setState-in-effect
  // (React's documented "adjusting state during render" pattern for derived resets).
  const filtersSignature = `${searchTerm}|${estado}`;
  const [appliedFiltersSignature, setAppliedFiltersSignature] = useState(filtersSignature);
  if (filtersSignature !== appliedFiltersSignature) {
    setAppliedFiltersSignature(filtersSignature);
    setPage(1);
  }

  const query: QueryState = { searchTerm, estado, pageSize, page, nonce: refetchNonce };
  const queryKey = buildQueryKey(query);

  const [result, setResult] = useState<CategoriasResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingCategoriaId, setViewingCategoriaId] = useState<number | null>(null);
  const [editingCategoriaId, setEditingCategoriaId] = useState<number | null>(null);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, estado, pageSize, page, nonce: refetchNonce });
    const params: CategoriasQueryParams = {
      busqueda: searchTerm || undefined,
      estado,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchCategorias(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, categorias: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          categorias: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar las categorías."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, estado, pageSize, page, refetchNonce]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleEstado(categoria: Categoria) {
    setTogglingId(categoria.id);
    setToggleError(null);
    try {
      if (categoria.estado === "activo") {
        await deshabilitarCategoria(categoria.id);
      } else {
        await habilitarCategoria(categoria.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado de la categoría."));
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setRefetchNonce((n) => n + 1);
  }

  function handleEdited() {
    setEditingCategoriaId(null);
    setRefetchNonce((n) => n + 1);
  }

  const editingCategoria = useCategoriaDetail(editingCategoriaId);

  const columns = buildCategoriaColumns({
    canEdit,
    canDisable,
    togglingId,
    onView: (categoria) => setViewingCategoriaId(categoria.id),
    onEdit: (categoria) => setEditingCategoriaId(categoria.id),
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Categorías</h1>
          <p className="text-sm text-muted-foreground">Gestiona las categorías de productos de tu empresa.</p>
        </div>

        {canCreate ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" />
              }
            >
              <Plus className="size-4" />
              Nueva Categoría
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoría</DialogTitle>
                <DialogDescription>
                  La categoría se crea para tu empresa; el nombre y la descripción se pueden ajustar después.
                </DialogDescription>
              </DialogHeader>
              <CategoriaForm onSuccess={handleCreated} />
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
            placeholder="Buscar por nombre o descripción…"
            className="pl-9"
            aria-label="Buscar categorías"
          />
        </div>

        <Select value={estado} onValueChange={(value) => setEstado((value as "activo" | "todos") ?? "activo")}>
          <SelectTrigger className="w-40" aria-label="Filtrar por estado">
            <SelectValue>{(value: string) => (value === "activo" ? "Activas" : "Todas")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activas</SelectItem>
            <SelectItem value="todos">Todas</SelectItem>
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
        data={result.categorias}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron categorías."
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

      <CategoriaViewDialog
        categoriaId={viewingCategoriaId}
        onClose={() => setViewingCategoriaId(null)}
        canEdit={canEdit}
        canDisable={canDisable}
        togglingId={togglingId}
        onEdit={(categoria) => {
          setViewingCategoriaId(null);
          setEditingCategoriaId(categoria.id);
        }}
        onToggleEstado={handleToggleEstado}
      />

      <Dialog open={editingCategoriaId !== null} onOpenChange={(open) => !open && setEditingCategoriaId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>Actualiza el nombre y la descripción de esta categoría.</DialogDescription>
          </DialogHeader>
          {editingCategoria.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : editingCategoria.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{editingCategoria.error}</AlertDescription>
            </Alert>
          ) : editingCategoria.categoria ? (
            <CategoriaForm categoria={editingCategoria.categoria} onSuccess={handleEdited} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
