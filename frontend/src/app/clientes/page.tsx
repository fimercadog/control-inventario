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
import { buildClienteColumns } from "@/app/clientes/columns";
import { ClienteViewDialog } from "@/app/clientes/cliente-view-dialog";
import { ClienteForm } from "@/components/forms/cliente-form";
import { useClienteDetail } from "@/hooks/use-cliente-detail";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchClientes, habilitarCliente, deshabilitarCliente } from "@/lib/api/clientes";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Cliente, ClientesQueryParams } from "@/types/cliente";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 20; // matches ClienteService::listar's real default (20, not 50/100)

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

interface ClientesResult {
  key: string;
  clientes: Cliente[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: ClientesResult = { key: "", clientes: [], meta: null, error: null };

export default function ClientesPage() {
  const canView = usePermission("clientes.ver");
  const canCreate = usePermission("clientes.crear");
  // ClientePolicy::update() (clientes.editar) gates both Editar and Habilitar;
  // ::delete() (clientes.gestionar) gates Deshabilitar only — same asymmetry as Proveedores.
  const canEdit = usePermission("clientes.editar");
  const canDisable = usePermission("clientes.gestionar");

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

  const [result, setResult] = useState<ClientesResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingClienteId, setViewingClienteId] = useState<number | null>(null);
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, estado, pageSize, page, nonce: refetchNonce });
    const params: ClientesQueryParams = {
      busqueda: searchTerm || undefined,
      estado,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchClientes(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, clientes: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          clientes: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar los clientes."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, estado, pageSize, page, refetchNonce]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleEstado(cliente: Cliente) {
    setTogglingId(cliente.id);
    setToggleError(null);
    try {
      if (cliente.estado === "activo") {
        await deshabilitarCliente(cliente.id);
      } else {
        await habilitarCliente(cliente.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado del cliente."));
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setRefetchNonce((n) => n + 1);
  }

  function handleEdited() {
    setEditingClienteId(null);
    setRefetchNonce((n) => n + 1);
  }

  const editingCliente = useClienteDetail(editingClienteId);

  const columns = buildClienteColumns({
    canEdit,
    canDisable,
    togglingId,
    onView: (cliente) => setViewingClienteId(cliente.id),
    onEdit: (cliente) => setEditingClienteId(cliente.id),
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona los clientes de tu empresa.</p>
        </div>

        {canCreate ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button />
              }
            >
              <Plus className="size-4" />
              Nuevo Cliente
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Cliente</DialogTitle>
                <DialogDescription>
                  El cliente se crea para tu empresa; NIT y email no se podrán editar después de creado.
                </DialogDescription>
              </DialogHeader>
              <ClienteForm onSuccess={handleCreated} />
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
            placeholder="Buscar clientes…"
            className="pl-9"
            aria-label="Buscar clientes"
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
      </div>

      {toggleError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{toggleError}</AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={columns}
        data={result.clientes}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron clientes."
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

      <ClienteViewDialog
        clienteId={viewingClienteId}
        onClose={() => setViewingClienteId(null)}
        canEdit={canEdit}
        canDisable={canDisable}
        togglingId={togglingId}
        onEdit={(cliente) => {
          setViewingClienteId(null);
          setEditingClienteId(cliente.id);
        }}
        onToggleEstado={handleToggleEstado}
      />

      <Dialog open={editingClienteId !== null} onOpenChange={(open) => !open && setEditingClienteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>NIT y email no son editables. El resto de los datos sí.</DialogDescription>
          </DialogHeader>
          {editingCliente.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : editingCliente.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{editingCliente.error}</AlertDescription>
            </Alert>
          ) : editingCliente.cliente ? (
            <ClienteForm cliente={editingCliente.cliente} onSuccess={handleEdited} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
