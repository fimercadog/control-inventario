"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserCog,
  Search,
  SearchX,
  MoreHorizontal,
  Ban,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
import { useCrudList } from "@/hooks/use-crud-list";
import { useAppSelector } from "@/store/hooks";
import { activarUsuario, desactivarUsuario, listUsuarios } from "@/lib/api/usuarios";
import type { Usuario } from "@/lib/api/types";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activos",
  inactivo: "Inactivos",
  todos: "Todos",
};

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). Alcance confirmado
 * explícitamente por el propietario del proyecto: Listar/Ver/Activar/
 * Desactivar únicamente. Sin botón "Nuevo" (la creación es Módulo 6 —
 * Invitaciones, sin construir) y sin ninguna acción "Eliminar" — Usuarios
 * nunca se elimina, solo se desactiva.
 */
export default function UsuariosPage() {
  const router = useRouter();
  const usuarioActual = useAppSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [page, setPage] = useState(1);
  const [itemAConfirmar, setItemAConfirmar] = useState<Usuario | null>(null);

  const {
    items: usuarios,
    meta,
    loading,
    refetch,
  } = useCrudList(
    () => listUsuarios({ busqueda: search || undefined, estado: estadoFiltro, page }),
    [search, estadoFiltro, page]
  );

  function cambiarFiltro(setter: () => void) {
    setter();
    setPage(1);
  }

  async function confirmarCambioEstado() {
    if (!itemAConfirmar) return;
    try {
      if (itemAConfirmar.is_active) {
        await desactivarUsuario(itemAConfirmar.id);
        toast.success("Usuario desactivado correctamente");
      } else {
        await activarUsuario(itemAConfirmar.id);
        toast.success("Usuario activado correctamente");
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(meta?.total ?? usuarios.length)} usuarios en tu empresa.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            className="pl-9"
            value={search}
            onChange={(e) => cambiarFiltro(() => setSearch(e.target.value))}
          />
        </div>
        <Select
          items={ESTADO_FILTROS}
          value={estadoFiltro}
          onValueChange={(value) => cambiarFiltro(() => setEstadoFiltro(value ?? "activo"))}
        >
          <SelectTrigger className="w-44">
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
        <CardContent className="px-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando usuarios...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Última actividad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => {
                  const esUsuarioActual = usuario.id === usuarioActual?.id;

                  return (
                    <TableRow
                      key={usuario.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/usuarios/${usuario.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <UserCog className="size-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {usuario.name}
                              {esUsuarioActual && <span className="ml-1.5 text-xs text-muted-foreground">(tú)</span>}
                            </span>
                            <span className="text-xs text-muted-foreground">{usuario.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{usuario.role ?? "Sin rol"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {usuario.last_activity_at ? formatRelativeTime(usuario.last_activity_at) : "Nunca"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            usuario.is_active
                              ? "bg-emerald-600 text-white dark:bg-emerald-500"
                              : "bg-red-600 text-white dark:bg-red-500"
                          }
                        >
                          {usuario.is_active ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem
                              disabled={usuario.is_active && esUsuarioActual}
                              onClick={() => setItemAConfirmar(usuario)}
                            >
                              {usuario.is_active ? (
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
                  );
                })}

                {usuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="No encontramos usuarios"
                        description="Prueba con otro nombre, correo o filtro de estado."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
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

      <ConfirmDialog
        open={itemAConfirmar !== null}
        onOpenChange={(open) => !open && setItemAConfirmar(null)}
        title={itemAConfirmar?.is_active ? "¿Desactivar este usuario?" : "¿Activar este usuario?"}
        description={
          itemAConfirmar?.is_active
            ? `"${itemAConfirmar?.name}" perderá acceso inmediatamente — se cierran todas sus sesiones activas.`
            : `"${itemAConfirmar?.name}" podrá volver a iniciar sesión.`
        }
        confirmLabel={itemAConfirmar?.is_active ? "Desactivar" : "Activar"}
        destructive={itemAConfirmar?.is_active}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}
