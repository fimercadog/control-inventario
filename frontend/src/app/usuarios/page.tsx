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
import { buildUsuarioColumns } from "@/app/usuarios/columns";
import { InviteUserForm } from "@/components/forms/invite-user-form";
import { EditUserForm } from "@/components/forms/edit-user-form";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { fetchUsuarios, activarUsuario, desactivarUsuario } from "@/lib/api/users";
import { fetchRolesActivos } from "@/lib/api/roles";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Usuario, UsuariosQueryParams } from "@/types/user";
import type { PaginationMeta } from "@/types/api";
import type { Role } from "@/types/role";

const DEFAULT_PAGE_SIZE = 100;

interface QueryState {
  searchTerm: string;
  rol: string;
  estado: "activo" | "todos";
  pageSize: number;
  page: number;
  nonce: number;
}

function buildQueryKey(query: QueryState): string {
  return JSON.stringify(query);
}

interface UsuariosResult {
  key: string;
  usuarios: Usuario[];
  meta: PaginationMeta | null;
  error: string | null;
}

const EMPTY_RESULT: UsuariosResult = { key: "", usuarios: [], meta: null, error: null };

export default function UsuariosPage() {
  const canView = usePermission("usuarios.ver");
  const canEdit = usePermission("usuarios.editar");
  const canListRoles = usePermission("roles.ver");
  const canInvite = usePermission("usuarios.invitar");

  const { inputValue: searchInput, setInputValue: setSearchInput, searchTerm } =
    useDebouncedSearch();
  const [estado, setEstado] = useState<"activo" | "todos">("activo");
  const [rol, setRol] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refetchNonce, setRefetchNonce] = useState(0);

  // Resets to page 1 whenever a filter changes, without a synchronous setState-in-effect
  // (React's documented "adjusting state during render" pattern for derived resets).
  const filtersSignature = `${searchTerm}|${rol}|${estado}`;
  const [appliedFiltersSignature, setAppliedFiltersSignature] = useState(filtersSignature);
  if (filtersSignature !== appliedFiltersSignature) {
    setAppliedFiltersSignature(filtersSignature);
    setPage(1);
  }

  const query: QueryState = { searchTerm, rol, estado, pageSize, page, nonce: refetchNonce };
  const queryKey = buildQueryKey(query);

  const [result, setResult] = useState<UsuariosResult>(EMPTY_RESULT);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    const key = buildQueryKey({ searchTerm, rol, estado, pageSize, page, nonce: refetchNonce });
    const params: UsuariosQueryParams = {
      busqueda: searchTerm || undefined,
      rol: rol === "todos" ? undefined : rol,
      estado,
      per_page: pageSize as 10 | 25 | 50 | 100,
      page,
    };
    fetchUsuarios(params)
      .then((data) => {
        if (ignore) return;
        setResult({ key, usuarios: data.items, meta: data.meta, error: null });
      })
      .catch((error) => {
        if (ignore) return;
        setResult({
          key,
          usuarios: [],
          meta: null,
          error: extractApiErrorMessage(error, "No se pudieron cargar los usuarios."),
        });
      });
    return () => {
      ignore = true;
    };
  }, [canView, searchTerm, rol, estado, pageSize, page, refetchNonce]);

  useEffect(() => {
    if (!canListRoles) return;
    fetchRolesActivos()
      .then(setRoles)
      .catch(() => setRoles([]));
  }, [canListRoles]);

  const isLoading = result.key !== queryKey;
  const isError = !isLoading && result.error !== null;

  async function handleToggleActivo(usuario: Usuario) {
    setTogglingId(usuario.id);
    setToggleError(null);
    try {
      if (usuario.is_active) {
        await desactivarUsuario(usuario.id);
      } else {
        await activarUsuario(usuario.id);
      }
      setRefetchNonce((n) => n + 1);
    } catch (error) {
      setToggleError(extractApiErrorMessage(error, "No se pudo actualizar el estado del usuario."));
    } finally {
      setTogglingId(null);
    }
  }

  function handleEditSuccess() {
    setEditingUsuario(null);
    setRefetchNonce((n) => n + 1);
  }

  const columns = buildUsuarioColumns({
    canEdit,
    togglingId,
    onToggleActivo: handleToggleActivo,
    onEditUsuario: setEditingUsuario,
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestiona los usuarios de tu empresa.</p>
        </div>

        <div className="flex items-center gap-2">
          {canInvite ? (
            <Dialog>
              <DialogTrigger
                render={
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" />
                }
              >
                <Plus className="size-4" />
                Nuevo Usuario
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    FidelOS no crea usuarios directamente: se envía una invitación por correo y la
                    persona completa su registro al aceptarla.
                  </DialogDescription>
                </DialogHeader>
                <InviteUserForm roles={roles} />
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="pl-9"
            aria-label="Buscar usuarios"
          />
        </div>

        <Select value={estado} onValueChange={(value) => setEstado((value as "activo" | "todos") ?? "activo")}>
          <SelectTrigger className="w-40" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>

        {canListRoles ? (
          <Select value={rol} onValueChange={(value) => setRol(value ?? "todos")}>
            <SelectTrigger className="w-48" aria-label="Filtrar por rol">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {toggleError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{toggleError}</AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={columns}
        data={result.usuarios}
        isLoading={isLoading}
        isError={isError}
        errorMessage={result.error ?? undefined}
        emptyMessage="No se encontraron usuarios."
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

      <Dialog open={editingUsuario !== null} onOpenChange={(open) => !open && setEditingUsuario(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar usuario</DialogTitle>
            <DialogDescription>
              Solo los campos operativos son editables aquí; nombre y correo no se pueden cambiar
              desde este formulario.
            </DialogDescription>
          </DialogHeader>
          {editingUsuario ? (
            <EditUserForm usuario={editingUsuario} onSuccess={handleEditSuccess} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
