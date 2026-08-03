"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Package, Search, SearchX, MoreHorizontal, Pencil, History, Loader2, Ban, CheckCircle2, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProductoFormModal } from "@/components/producto-form-modal";
import { ProductoViewModal } from "@/components/producto-view-modal";
import { useCrudList } from "@/hooks/use-crud-list";
import { listProductos, disableProducto, enableProducto } from "@/lib/api/productos";
import type { Producto } from "@/lib/api/types";
import { colorFromString } from "@/lib/color-from-string";
import { formatCurrency, formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activos",
  todos: "Todos (incluye inactivos)",
};

/**
 * Corrección de auditoría funcional (docs/06_TESTS/DemoDataAudit.md,
 * 2026-07-30): agrega Estado (badge) + Activar/Desactivar (Logical
 * Delete) al listado — el módulo Productos no los tenía, a diferencia de
 * Proveedores, que ya cumplía el Global CRUD Standard. Usa `useCrudList`
 * (Global UI Standard) en vez de parchear el arreglo local a mano.
 * Global UI Standard (2026-08-03): Crear/Editar/Ver vía modal, la tabla
 * nunca se abandona — incluida la pestaña "Movimientos" (antes un
 * parámetro de URL `?tab=movimientos`, ahora abre el modal directo en
 * esa pestaña).
 */
export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verParam = searchParams.get("ver");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [productoAConfirmar, setProductoAConfirmar] = useState<Producto | null>(null);
  const [creating, setCreating] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(verParam ? Number(verParam) : null);

  const {
    items: productos,
    loading,
    refetch,
  } = useCrudList(() => listProductos({ estado: estadoFiltro }), [estadoFiltro]);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(productos.map((p) => p.categoria).filter((c): c is string => Boolean(c))))],
    [productos]
  );

  const filtered = useMemo(() => {
    return productos.filter((product) => {
      const matchesSearch =
        search.trim() === "" ||
        product.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (product.marca ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "Todas" || product.categoria === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, productos]);

  async function confirmarCambioEstado() {
    if (!productoAConfirmar) return;
    try {
      if (productoAConfirmar.estado === "activo") {
        await disableProducto(productoAConfirmar.id);
        toast.success("Producto deshabilitado correctamente");
      } else {
        await enableProducto(productoAConfirmar.id);
        toast.success("Producto habilitado correctamente");
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
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Cargando catálogo..."
              : filtered.length === productos.length
                ? `${formatNumber(productos.length)} productos en tu catálogo.`
                : `${formatNumber(filtered.length)} de ${formatNumber(productos.length)} productos.`}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nuevo Producto
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o marca..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          items={Object.fromEntries(categories.map((c) => [c, c]))}
          value={category}
          onValueChange={(value) => setCategory(value ?? "Todas")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              Cargando productos...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => {
                  const low = product.stock_actual <= product.stock_minimo;
                  return (
                    <TableRow key={product.id} className="cursor-pointer" onClick={() => setViewingId(product.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: colorFromString(product.nombre) }}
                          >
                            <Package className="size-4" />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">{product.nombre}</span>
                            <span className="text-xs text-muted-foreground">{product.marca}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.categoria && <Badge variant="secondary">{product.categoria}</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.presentacion}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            low
                              ? "font-medium tabular-nums text-destructive"
                              : "font-medium tabular-nums"
                          }
                        >
                          {formatNumber(product.stock_actual)} {product.unidad_medida?.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(product.precio)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            product.estado === "activo"
                              ? "bg-emerald-600 text-white dark:bg-emerald-500"
                              : "bg-red-600 text-white dark:bg-red-500"
                          }
                        >
                          {product.estado === "activo" ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => setEditando(product)}>
                              <Pencil />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingId(product.id)}>
                              <History />
                              Ver movimientos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProductoAConfirmar(product)}>
                              {product.estado === "activo" ? (
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
                  );
                })}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="No encontramos productos"
                        description="Prueba con otro nombre, marca o categoría."
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearch("");
                              setCategory("Todas");
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {productoAConfirmar && (
        <ConfirmDialog
          open={productoAConfirmar !== null}
          onOpenChange={(open) => !open && setProductoAConfirmar(null)}
          title={productoAConfirmar.estado === "activo" ? "¿Eliminar este producto?" : "¿Habilitar este producto?"}
          description={
            productoAConfirmar.estado === "activo"
              ? `"${productoAConfirmar.nombre}" se marcará como inactivo. No se elimina físicamente ni se pierde su historial de movimientos — puedes habilitarlo de nuevo en cualquier momento.`
              : `"${productoAConfirmar.nombre}" volverá a estar activo y visible en el catálogo.`
          }
          confirmLabel={productoAConfirmar.estado === "activo" ? "Eliminar" : "Habilitar"}
          destructive={productoAConfirmar.estado === "activo"}
          onConfirm={confirmarCambioEstado}
        />
      )}

      <ProductoFormModal
        open={creating}
        onOpenChange={setCreating}
        onSaved={(creado) => {
          refetch();
          setViewingId(creado.id);
        }}
      />

      <ProductoFormModal
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        producto={editando}
        onSaved={() => refetch()}
      />

      <ProductoViewModal
        productoId={viewingId}
        open={viewingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingId(null);
            if (verParam) router.replace("/productos");
          }
        }}
        onChanged={() => refetch()}
      />
    </div>
  );
}
