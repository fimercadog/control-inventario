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
import { buildUnidadMedidaColumns } from "@/app/unidades/columns";
import { UnidadMedidaViewDialog } from "@/app/unidades/unidad-medida-view-dialog";
import { UnidadMedidaForm } from "@/components/forms/unidad-medida-form";
import { useUnidadMedidaDetail } from "@/hooks/use-unidad-medida-detail";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchUnidadesMedida, habilitarUnidadMedida, deshabilitarUnidadMedida } from "@/lib/api/unidades-medida";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { UnidadMedida, UnidadesMedidaQueryParams } from "@/types/unidad-medida";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 100; // matches UnidadMedidaController::index's real default

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

interface UnidadesMedidaResult {
  key: string;
  unidades: UnidadMedida[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: UnidadesMedidaResult = { key: "", unidades: [], meta: null, error: null };

export default function UnidadesMedidaPage() {
  const canView = usePermission("unidades-medida.ver");
  const canCreate = usePermission("unidades-medida.crear");
  // UnidadMedidaPolicy::update() (unidades-medida.editar) gates both Editar and Habilitar;
  // ::delete() (unidades-medida.gestionar) gates Deshabilitar only — same asymmetry as
  // Categorías/Marcas.
  const canEdit = usePermission("unidades-medida.editar");
  const canDisable = usePermission("unidades-medida.gestionar");

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

  const [result, setResult] = useState<UnidadesMedidaResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingUnidadId, setViewingUnidadId] = useState<number | null>(null);
  const [editingUnidadId, setEditingUnidadId] = useState<number | null>(null);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, estado, pageSize, page, nonce: refetchNonce });
    const params: UnidadesMedidaQueryParams = {
      busqueda: searchTerm || undefined,
      estado,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchUnidadesMedida(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, unidades: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          unidades: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar las unidades de medida."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, estado, pageSize, page, refetchNonce]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleEstado(unidad: UnidadMedida) {
    setTogglingId(unidad.id);
    setToggleError(null);
    try {
      if (unidad.estado === "activo") {
        await deshabilitarUnidadMedida(unidad.id);
      } else {
        await habilitarUnidadMedida(unidad.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado de la unidad de medida."));
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setRefetchNonce((n) => n + 1);
  }

  function handleEdited() {
    setEditingUnidadId(null);
    setRefetchNonce((n) => n + 1);
  }

  const editingUnidad = useUnidadMedidaDetail(editingUnidadId);

  const columns = buildUnidadMedidaColumns({
    canEdit,
    canDisable,
    togglingId,
    onView: (unidad) => setViewingUnidadId(unidad.id),
    onEdit: (unidad) => setEditingUnidadId(unidad.id),
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Unidades de Medida</h1>
          <p className="text-sm text-muted-foreground">Gestiona las unidades de medida de tu empresa.</p>
        </div>

        {canCreate ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" />
              }
            >
              <Plus className="size-4" />
              Nueva Unidad de Medida
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Unidad de Medida</DialogTitle>
                <DialogDescription>La unidad de medida se crea para tu empresa.</DialogDescription>
              </DialogHeader>
              <UnidadMedidaForm onSuccess={handleCreated} />
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
            placeholder="Buscar por nombre o abreviatura…"
            className="pl-9"
            aria-label="Buscar unidades de medida"
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
        data={result.unidades}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron unidades de medida."
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

      <UnidadMedidaViewDialog
        unidadMedidaId={viewingUnidadId}
        onClose={() => setViewingUnidadId(null)}
        canEdit={canEdit}
        canDisable={canDisable}
        togglingId={togglingId}
        onEdit={(unidad) => {
          setViewingUnidadId(null);
          setEditingUnidadId(unidad.id);
        }}
        onToggleEstado={handleToggleEstado}
      />

      <Dialog open={editingUnidadId !== null} onOpenChange={(open) => !open && setEditingUnidadId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar unidad de medida</DialogTitle>
            <DialogDescription>Actualiza el nombre o la abreviatura.</DialogDescription>
          </DialogHeader>
          {editingUnidad.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : editingUnidad.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{editingUnidad.error}</AlertDescription>
            </Alert>
          ) : editingUnidad.unidadMedida ? (
            <UnidadMedidaForm unidadMedida={editingUnidad.unidadMedida} onSuccess={handleEdited} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
