"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Contact,
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
import { ClienteFormModal } from "@/components/cliente-form-modal";
import { ClienteViewModal } from "@/components/cliente-view-modal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchClientes, disableClienteThunk, enableClienteThunk } from "@/store/slices/clientes-slice";
import type { Cliente } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activos",
  todos: "Todos (incluye inactivos)",
};

/**
 * Módulo Clientes (2026-08-02, docs/03_FUNCTIONAL_SPEC/Customers.md).
 * Primer módulo de este proyecto construido como vertical slice completo
 * desde el día uno — Repository+Service+DTO en el backend, Redux en el
 * frontend (a diferencia de Categorías/Proveedores/etc., que usan
 * `useCrudList`; ver el comentario de `clientes-slice.ts`). Mismo nivel
 * funcional que Proveedores: búsqueda, filtro de estado, paginación real,
 * Logical Delete con confirmación. Global UI Standard (2026-08-03):
 * Crear/Editar/Ver vía modal, la tabla nunca se abandona.
 */
export default function ClientesPage() {
  const dispatch = useAppDispatch();
  const { items: clientes, meta, loading } = useAppSelector((state) => state.clientes);

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [page, setPage] = useState(1);
  const [clienteAConfirmar, setClienteAConfirmar] = useState<Cliente | null>(null);
  const [creating, setCreating] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, estadoFiltro]);

  useEffect(() => {
    dispatch(fetchClientes({ busqueda: search || undefined, estado: estadoFiltro, page }));
  }, [dispatch, search, estadoFiltro, page]);

  function refetch() {
    dispatch(fetchClientes({ busqueda: search || undefined, estado: estadoFiltro, page }));
  }

  async function confirmarCambioEstado() {
    if (!clienteAConfirmar) return;
    try {
      if (clienteAConfirmar.estado === "activo") {
        await dispatch(disableClienteThunk(clienteAConfirmar.id)).unwrap();
        toast.success("Cliente deshabilitado correctamente");
      } else {
        await dispatch(enableClienteThunk(clienteAConfirmar.id)).unwrap();
        toast.success("Cliente habilitado correctamente");
      }
      refetch();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos actualizar el estado.");
    } finally {
      setClienteAConfirmar(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(meta?.total ?? clientes.length)} clientes.`}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, NIT, contacto o email..."
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
              Cargando clientes...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>NIT</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="cursor-pointer" onClick={() => setViewingId(cliente.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Contact className="size-4" />
                          </div>
                          <span className="font-medium">{cliente.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{cliente.nit ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{cliente.contacto ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{cliente.telefono ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            cliente.estado === "activo"
                              ? "bg-emerald-600 text-white dark:bg-emerald-500"
                              : "bg-red-600 text-white dark:bg-red-500"
                          }
                        >
                          {cliente.estado === "activo" ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => setEditando(cliente)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setClienteAConfirmar(cliente)}>
                              {cliente.estado === "activo" ? (
                                <>
                                  <Ban />
                                  Eliminar (deshabilitar)
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 />
                                  Habilitar
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {clientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <EmptyState
                          icon={SearchX}
                          title="No encontramos clientes"
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

      {clienteAConfirmar && (
        <ConfirmDialog
          open={clienteAConfirmar !== null}
          onOpenChange={(open) => !open && setClienteAConfirmar(null)}
          title={clienteAConfirmar.estado === "activo" ? "¿Eliminar este cliente?" : "¿Habilitar este cliente?"}
          description={
            clienteAConfirmar.estado === "activo"
              ? `"${clienteAConfirmar.nombre}" se marcará como inactivo. No se elimina físicamente — puedes habilitarlo de nuevo en cualquier momento.`
              : `"${clienteAConfirmar.nombre}" volverá a estar activo y disponible.`
          }
          confirmLabel={clienteAConfirmar.estado === "activo" ? "Eliminar" : "Habilitar"}
          destructive={clienteAConfirmar.estado === "activo"}
          onConfirm={confirmarCambioEstado}
        />
      )}

      <ClienteFormModal open={creating} onOpenChange={setCreating} onSaved={() => refetch()} />

      <ClienteFormModal
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        cliente={editando}
        onSaved={() => refetch()}
      />

      <ClienteViewModal
        clienteId={viewingId}
        open={viewingId !== null}
        onOpenChange={(open) => !open && setViewingId(null)}
        onChanged={() => refetch()}
      />
    </div>
  );
}
