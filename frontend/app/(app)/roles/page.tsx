"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Search,
  SearchX,
  MoreHorizontal,
  Pencil,
  Ban,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoleFormModal } from "@/components/role-form-modal";
import { RoleViewModal } from "@/components/role-view-modal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchRoles, desactivarRoleThunk, activarRoleThunk } from "@/store/slices/roles-slice";
import type { Role } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activos",
  todos: "Todos (incluye inactivos)",
};

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md).
 * Mismo shape que Clientes: búsqueda, filtro de estado, paginación real,
 * Redux. Desactivar puede rechazarse con 409 si el rol tiene usuarios
 * asignados — el mensaje real del backend se muestra tal cual, no un
 * genérico. Global UI Standard (2026-08-03): Crear/Editar/Ver vía modal,
 * la tabla nunca se abandona.
 */
export default function RolesPage() {
  const dispatch = useAppDispatch();
  const { items: roles, meta, loading } = useAppSelector((state) => state.roles);

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [page, setPage] = useState(1);
  const [roleAConfirmar, setRoleAConfirmar] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [editando, setEditando] = useState<Role | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, estadoFiltro]);

  useEffect(() => {
    dispatch(fetchRoles({ busqueda: search || undefined, estado: estadoFiltro, page }));
  }, [dispatch, search, estadoFiltro, page]);

  function refetch() {
    dispatch(fetchRoles({ busqueda: search || undefined, estado: estadoFiltro, page }));
  }

  async function confirmarCambioEstado() {
    if (!roleAConfirmar) return;
    try {
      if (roleAConfirmar.estado === "activo") {
        await dispatch(desactivarRoleThunk(roleAConfirmar.id)).unwrap();
        toast.success("Rol desactivado correctamente");
      } else {
        await dispatch(activarRoleThunk(roleAConfirmar.id)).unwrap();
        toast.success("Rol activado correctamente");
      }
      refetch();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos actualizar el estado.");
    } finally {
      setRoleAConfirmar(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(meta?.total ?? roles.length)} roles.`}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nuevo Rol
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          items={ESTADO_FILTROS}
          value={estadoFiltro}
          onValueChange={(value) => setEstadoFiltro(value ?? "activo")}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ESTADO_FILTROS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 py-0">
        <CardContent className="flex flex-col gap-4 px-0 pb-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando roles...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Permisos</TableHead>
                    <TableHead className="text-right">Usuarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id} className="cursor-pointer" onClick={() => setViewingId(role.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <ShieldCheck className="size-4" />
                          </div>
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatNumber(role.permisos_count ?? 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatNumber(role.usuarios_count ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            role.estado === "activo"
                              ? "bg-emerald-600 text-white dark:bg-emerald-500"
                              : "bg-red-600 text-white dark:bg-red-500"
                          }
                        >
                          {role.estado === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditando(role)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRoleAConfirmar(role)}>
                              {role.estado === "activo" ? (
                                <>
                                  <Ban />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <EmptyState
                          icon={SearchX}
                          title="No encontramos roles"
                          description="Prueba con otro nombre, o crea el primero."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 px-4 pt-4">
                  <span className="text-sm text-muted-foreground">
                    Página {meta.current_page} de {meta.last_page}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={page >= meta.last_page || loading}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {roleAConfirmar && (
        <ConfirmDialog
          open={roleAConfirmar !== null}
          onOpenChange={(open) => !open && setRoleAConfirmar(null)}
          title={roleAConfirmar.estado === "activo" ? "¿Desactivar este rol?" : "¿Activar este rol?"}
          description={
            roleAConfirmar.estado === "activo"
              ? `"${roleAConfirmar.name}" se marcará como inactivo. Si tiene usuarios asignados, la desactivación se rechazará hasta que se reasignen a otro rol.`
              : `"${roleAConfirmar.name}" volverá a estar activo y disponible.`
          }
          confirmLabel={roleAConfirmar.estado === "activo" ? "Desactivar" : "Activar"}
          destructive={roleAConfirmar.estado === "activo"}
          onConfirm={confirmarCambioEstado}
        />
      )}

      <RoleFormModal open={creating} onOpenChange={setCreating} onSaved={() => refetch()} />

      <RoleFormModal
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        role={editando}
        onSaved={() => refetch()}
      />

      <RoleViewModal
        roleId={viewingId}
        open={viewingId !== null}
        onOpenChange={(open) => !open && setViewingId(null)}
        onChanged={() => refetch()}
      />
    </div>
  );
}
