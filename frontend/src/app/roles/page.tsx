"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, Loader2, Plus, Search } from "lucide-react";
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
import { buildRoleColumns } from "@/app/roles/columns";
import { RoleViewDialog } from "@/app/roles/role-view-dialog";
import { RoleForm } from "@/components/forms/role-form";
import { useRoleDetail } from "@/hooks/use-role-detail";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchRoles, activarRol, desactivarRol, exportarRolesCsv, exportarRolesPdf } from "@/lib/api/roles";
import { fetchPermisos } from "@/lib/api/permissions";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Role, RolesQueryParams } from "@/types/role";
import type { PaginationMeta } from "@/types/api";

const DEFAULT_PAGE_SIZE = 20; // matches RoleController::index's real default

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface RolesResult {
  key: string;
  roles: Role[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: RolesResult = { key: "", roles: [], meta: null, error: null };

export default function RolesPage() {
  const canView = usePermission("roles.ver");
  const canManage = usePermission("roles.gestionar");

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

  const [result, setResult] = useState<RolesResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [exportingFormat, setExportingFormat] = useState<"csv" | "pdf" | null>(null);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingRoleId, setViewingRoleId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, estado, pageSize, page, nonce: refetchNonce });
    const params: RolesQueryParams = {
      busqueda: searchTerm || undefined,
      estado,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchRoles(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, roles: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          roles: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar los roles."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, estado, pageSize, page, refetchNonce]);

  useEffect(() => {
    if (!canView) return;
    fetchPermisos()
      .then(setAllPermissions)
      .catch(() => setAllPermissions([]));
  }, [canView]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleEstado(role: Role) {
    setTogglingId(role.id);
    setToggleError(null);
    try {
      if (role.estado === "activo") {
        await desactivarRol(role.id);
      } else {
        await activarRol(role.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado del rol."));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleExport(formato: "csv" | "pdf") {
    setExportingFormat(formato);
    setToggleError(null);
    try {
      // Same busqueda/estado the list is currently showing — never page/per_page, the
      // export covers the full filtered result set, not just the visible page.
      const params: RolesQueryParams = { busqueda: searchTerm || undefined, estado };
      const { blob, filename } = formato === "csv" ? await exportarRolesCsv(params) : await exportarRolesPdf(params);
      downloadBlob(blob, filename);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo generar el archivo de exportación."));
    } finally {
      setExportingFormat(null);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setRefetchNonce((n) => n + 1);
  }

  function handleEdited() {
    setEditingRoleId(null);
    setRefetchNonce((n) => n + 1);
  }

  const editingRole = useRoleDetail(editingRoleId);

  const columns = buildRoleColumns({
    canManage,
    togglingId,
    onView: (role) => setViewingRoleId(role.id),
    onEdit: (role) => setEditingRoleId(role.id),
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Roles</h1>
          <p className="text-sm text-muted-foreground">Gestiona los roles y permisos de tu empresa.</p>
        </div>

        {canManage ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button />
              }
            >
              <Plus className="size-4" />
              Nuevo Rol
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Rol</DialogTitle>
                <DialogDescription>
                  El rol se crea para tu empresa; nombre y permisos se pueden ajustar después.
                </DialogDescription>
              </DialogHeader>
              <RoleForm allPermissions={allPermissions} onSuccess={handleCreated} />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exportingFormat !== null}
            onClick={() => handleExport("csv")}
          >
            {exportingFormat === "csv" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exportingFormat !== null}
            onClick={() => handleExport("pdf")}
          >
            {exportingFormat === "pdf" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            PDF
          </Button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre…"
            className="pl-9"
            aria-label="Buscar roles"
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
        showExports={false}
        data={result.roles}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron roles."
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

      <RoleViewDialog
        roleId={viewingRoleId}
        onClose={() => setViewingRoleId(null)}
        canManage={canManage}
        togglingId={togglingId}
        onEdit={(role) => {
          setViewingRoleId(null);
          setEditingRoleId(role.id);
        }}
        onToggleEstado={handleToggleEstado}
      />

      <Dialog open={editingRoleId !== null} onOpenChange={(open) => !open && setEditingRoleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar rol</DialogTitle>
            <DialogDescription>Actualiza el nombre y los permisos de este rol.</DialogDescription>
          </DialogHeader>
          {editingRole.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : editingRole.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{editingRole.error}</AlertDescription>
            </Alert>
          ) : editingRole.role ? (
            <RoleForm role={editingRole.role} allPermissions={allPermissions} onSuccess={handleEdited} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
