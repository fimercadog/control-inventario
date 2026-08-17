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
import { buildMarcaColumns } from "@/app/marcas/columns";
import { MarcaViewDialog } from "@/app/marcas/marca-view-dialog";
import { MarcaForm } from "@/components/forms/marca-form";
import { useMarcaDetail } from "@/hooks/use-marca-detail";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchMarcas, habilitarMarca, deshabilitarMarca } from "@/lib/api/marcas";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Marca, MarcasQueryParams } from "@/types/marca";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 100; // matches MarcaController::index's real default

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

interface MarcasResult {
  key: string;
  marcas: Marca[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: MarcasResult = { key: "", marcas: [], meta: null, error: null };

export default function MarcasPage() {
  const canView = usePermission("marcas.ver");
  const canCreate = usePermission("marcas.crear");
  // MarcaPolicy::update() (marcas.editar) gates both Editar and Habilitar;
  // ::delete() (marcas.gestionar) gates Deshabilitar only — same asymmetry as Categorías.
  const canEdit = usePermission("marcas.editar");
  const canDisable = usePermission("marcas.gestionar");

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

  const [result, setResult] = useState<MarcasResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingMarcaId, setViewingMarcaId] = useState<number | null>(null);
  const [editingMarcaId, setEditingMarcaId] = useState<number | null>(null);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, estado, pageSize, page, nonce: refetchNonce });
    const params: MarcasQueryParams = {
      busqueda: searchTerm || undefined,
      estado,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchMarcas(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, marcas: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          marcas: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar las marcas."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, estado, pageSize, page, refetchNonce]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleEstado(marca: Marca) {
    setTogglingId(marca.id);
    setToggleError(null);
    try {
      if (marca.estado === "activo") {
        await deshabilitarMarca(marca.id);
      } else {
        await habilitarMarca(marca.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado de la marca."));
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setRefetchNonce((n) => n + 1);
  }

  function handleEdited() {
    setEditingMarcaId(null);
    setRefetchNonce((n) => n + 1);
  }

  const editingMarca = useMarcaDetail(editingMarcaId);

  const columns = buildMarcaColumns({
    canEdit,
    canDisable,
    togglingId,
    onView: (marca) => setViewingMarcaId(marca.id),
    onEdit: (marca) => setEditingMarcaId(marca.id),
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Marcas</h1>
          <p className="text-sm text-muted-foreground">Gestiona las marcas de productos de tu empresa.</p>
        </div>

        {canCreate ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" />
              }
            >
              <Plus className="size-4" />
              Nueva Marca
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Marca</DialogTitle>
                <DialogDescription>La marca se crea para tu empresa.</DialogDescription>
              </DialogHeader>
              <MarcaForm onSuccess={handleCreated} />
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
            placeholder="Buscar por nombre…"
            className="pl-9"
            aria-label="Buscar marcas"
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
        data={result.marcas}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron marcas."
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

      <MarcaViewDialog
        marcaId={viewingMarcaId}
        onClose={() => setViewingMarcaId(null)}
        canEdit={canEdit}
        canDisable={canDisable}
        togglingId={togglingId}
        onEdit={(marca) => {
          setViewingMarcaId(null);
          setEditingMarcaId(marca.id);
        }}
        onToggleEstado={handleToggleEstado}
      />

      <Dialog open={editingMarcaId !== null} onOpenChange={(open) => !open && setEditingMarcaId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar marca</DialogTitle>
            <DialogDescription>Actualiza el nombre de esta marca.</DialogDescription>
          </DialogHeader>
          {editingMarca.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : editingMarca.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{editingMarca.error}</AlertDescription>
            </Alert>
          ) : editingMarca.marca ? (
            <MarcaForm marca={editingMarca.marca} onSuccess={handleEdited} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
