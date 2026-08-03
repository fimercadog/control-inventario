"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, CheckCircle2, Package, Pencil, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { CategoriaFormModal } from "@/components/categoria-form-modal";
import { getCategoria, disableCategoria, enableCategoria, listProductosDeCategoria } from "@/lib/api/categorias";
import type { Categoria, Producto } from "@/lib/api/types";
import { formatCurrency, formatNumber } from "@/lib/format";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/categorias/{id}` — ver/editar/deshabilitar una categoría sin salir
 * del listado, que permanece visible detrás del modal.
 */
export function CategoriaViewModal({
  categoriaId,
  open,
  onOpenChange,
  onChanged,
}: {
  categoriaId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || categoriaId == null) return;
    setLoading(true);
    Promise.all([getCategoria(categoriaId), listProductosDeCategoria(categoriaId)])
      .then(([categoriaResult, productosResult]) => {
        setCategoria(categoriaResult);
        setProductos(productosResult);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar la categoría.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, categoriaId, onOpenChange]);

  async function cambiarEstado() {
    if (!categoria) return;
    const actualizada =
      categoria.estado === "activo" ? await disableCategoria(categoria.id) : await enableCategoria(categoria.id);
    setCategoria(actualizada);
    toast.success(actualizada.estado === "activo" ? "Categoría habilitada" : "Categoría deshabilitada");
    onChanged();
  }

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={Tags}
        title={categoria?.nombre ?? ""}
        loading={loading}
        badge={
          categoria && (
            <Badge
              className={
                categoria.estado === "activo"
                  ? "w-fit bg-emerald-600 text-white dark:bg-emerald-500"
                  : "w-fit bg-red-600 text-white dark:bg-red-500"
              }
            >
              {categoria.estado === "activo" ? "Activa" : "Inactiva"}
            </Badge>
          )
        }
        headerActions={
          categoria && (
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirmando(true)}>
                {categoria.estado === "activo" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {categoria.estado === "activo" ? "Eliminar" : "Habilitar"}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </>
          )
        }
        tabs={
          categoria
            ? [
                {
                  value: "detalle",
                  label: "Detalle",
                  content: (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <InfoRow label="Descripción" value={categoria.descripcion ?? "—"} />
                      <InfoRow label="Productos asociados" value={formatNumber(productos.length)} emphasize />
                    </div>
                  ),
                },
                {
                  value: "productos",
                  label: `Productos (${productos.length})`,
                  content: (
                    <Card className="border-border/60 py-0">
                      <CardContent className="px-0">
                        {productos.length === 0 ? (
                          <EmptyState
                            icon={Package}
                            title="Sin productos asociados"
                            description="Todavía ningún producto usa esta categoría."
                          />
                        ) : (
                          <ul className="divide-y">
                            {productos.map((producto) => (
                              <li key={producto.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Package className="size-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <Link href={`/productos/${producto.id}`} className="text-sm font-medium hover:underline">
                                      {producto.nombre}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                      {producto.marca ?? "Sin marca"} · Stock: {formatNumber(producto.stock_actual)}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-sm tabular-nums text-muted-foreground">
                                  {formatCurrency(producto.precio)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ),
                },
              ]
            : undefined
        }
      />

      <CategoriaFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        categoria={categoria}
        onSaved={(actualizada) => {
          setCategoria(actualizada);
          onChanged();
        }}
      />

      {categoria && (
        <ConfirmDialog
          open={confirmando}
          onOpenChange={setConfirmando}
          title={categoria.estado === "activo" ? "¿Eliminar esta categoría?" : "¿Habilitar esta categoría?"}
          description={
            categoria.estado === "activo"
              ? `"${categoria.nombre}" se marcará como inactiva. No se elimina físicamente ni afecta a los productos que ya la usan — puedes habilitarla de nuevo en cualquier momento.`
              : `"${categoria.nombre}" volverá a estar activa y disponible.`
          }
          confirmLabel={categoria.estado === "activo" ? "Eliminar" : "Habilitar"}
          destructive={categoria.estado === "activo"}
          onConfirm={cambiarEstado}
        />
      )}
    </>
  );
}
