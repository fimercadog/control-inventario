"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Truck, Search, SearchX, MoreHorizontal, Pencil, Ban, CheckCircle2, Loader2, Plus } from "lucide-react";
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
import { ProveedorFormModal } from "@/components/proveedor-form-modal";
import { ProveedorViewModal } from "@/components/proveedor-view-modal";
import { listProveedores, disableProveedor, enableProveedor } from "@/lib/api/proveedores";
import type { Proveedor } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activos",
  todos: "Todos (incluye inactivos)",
};

/**
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). GLOBAL UI STANDARD:
 * proveedores inactivos (deshabilitados) quedan ocultos del listado por
 * defecto — visibles solo con el filtro "Todos". Global UI Standard
 * (2026-08-03): Crear/Editar/Ver vía modal, la tabla nunca se abandona;
 * toda mutación se refresca desde el backend (`cargar()`), nunca se
 * parcha el arreglo local a mano.
 */
export default function SuppliersPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [proveedorAConfirmar, setProveedorAConfirmar] = useState<Proveedor | null>(null);
  const [creating, setCreating] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  async function cargar() {
    setLoading(true);
    try {
      const result = await listProveedores({ busqueda: search || undefined, estado: estadoFiltro });
      setProveedores(result.items);
      setTotal(result.meta.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos cargar los proveedores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(cargar, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, estadoFiltro]);

  async function confirmarCambioEstado() {
    if (!proveedorAConfirmar) return;
    try {
      if (proveedorAConfirmar.estado === "activo") {
        await disableProveedor(proveedorAConfirmar.id);
        toast.success("Proveedor deshabilitado correctamente");
      } else {
        await enableProveedor(proveedorAConfirmar.id);
        toast.success("Proveedor habilitado correctamente");
      }
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el proveedor.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(total)} proveedores.`}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, NIT o contacto..."
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
        <CardContent className="px-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando proveedores...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ciudad / País</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((proveedor) => (
                  <TableRow
                    key={proveedor.id}
                    className="cursor-pointer"
                    onClick={() => setViewingId(proveedor.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Truck className="size-4" />
                        </div>
                        <span className="font-medium">{proveedor.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{proveedor.nit ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{proveedor.contacto ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[proveedor.ciudad, proveedor.pais].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={proveedor.estado === "activo" ? "outline" : "secondary"}>
                        {proveedor.estado === "activo" ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setEditando(proveedor)}>
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setProveedorAConfirmar(proveedor)}>
                            {proveedor.estado === "activo" ? (
                              <>
                                <Ban />
                                Deshabilitar
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

                {proveedores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="No encontramos proveedores"
                        description="Prueba con otro nombre, NIT o contacto, o crea el primero."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {proveedorAConfirmar && (
        <ConfirmDialog
          open={proveedorAConfirmar !== null}
          onOpenChange={(open) => !open && setProveedorAConfirmar(null)}
          title={
            proveedorAConfirmar.estado === "activo" ? "¿Deshabilitar este proveedor?" : "¿Habilitar este proveedor?"
          }
          description={
            proveedorAConfirmar.estado === "activo"
              ? `"${proveedorAConfirmar.nombre}" se marcará como inactivo. No se elimina físicamente ni afecta a los productos ya asociados — puedes habilitarlo de nuevo en cualquier momento.`
              : `"${proveedorAConfirmar.nombre}" volverá a estar activo y disponible.`
          }
          confirmLabel={proveedorAConfirmar.estado === "activo" ? "Deshabilitar" : "Habilitar"}
          destructive={proveedorAConfirmar.estado === "activo"}
          onConfirm={confirmarCambioEstado}
        />
      )}

      <ProveedorFormModal open={creating} onOpenChange={setCreating} onSaved={() => cargar()} />

      <ProveedorFormModal
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        proveedor={editando}
        onSaved={() => cargar()}
      />

      <ProveedorViewModal
        proveedorId={viewingId}
        open={viewingId !== null}
        onOpenChange={(open) => !open && setViewingId(null)}
        onChanged={() => cargar()}
      />
    </div>
  );
}
