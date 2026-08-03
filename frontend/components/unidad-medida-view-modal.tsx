"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, CheckCircle2, Package, Pencil, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { UnidadMedidaFormModal } from "@/components/unidad-medida-form-modal";
import {
  getUnidadMedida,
  disableUnidadMedida,
  enableUnidadMedida,
  listProductosDeUnidadMedida,
} from "@/lib/api/unidades-medida";
import type { Producto, UnidadMedida } from "@/lib/api/types";
import { formatCurrency, formatNumber } from "@/lib/format";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/unidades-medida/{id}` — ver/editar/deshabilitar una unidad de
 * medida sin salir del listado, que permanece visible detrás del modal.
 */
export function UnidadMedidaViewModal({
  unidadMedidaId,
  open,
  onOpenChange,
  onChanged,
}: {
  unidadMedidaId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [unidad, setUnidad] = useState<UnidadMedida | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || unidadMedidaId == null) return;
    setLoading(true);
    Promise.all([getUnidadMedida(unidadMedidaId), listProductosDeUnidadMedida(unidadMedidaId)])
      .then(([unidadResult, productosResult]) => {
        setUnidad(unidadResult);
        setProductos(productosResult);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar la unidad de medida.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, unidadMedidaId, onOpenChange]);

  async function cambiarEstado() {
    if (!unidad) return;
    const actualizada =
      unidad.estado === "activo" ? await disableUnidadMedida(unidad.id) : await enableUnidadMedida(unidad.id);
    setUnidad(actualizada);
    toast.success(actualizada.estado === "activo" ? "Unidad de medida habilitada" : "Unidad de medida deshabilitada");
    onChanged();
  }

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={Ruler}
        title={unidad?.nombre ?? ""}
        loading={loading}
        badge={
          unidad && (
            <Badge
              className={
                unidad.estado === "activo"
                  ? "w-fit bg-emerald-600 text-white dark:bg-emerald-500"
                  : "w-fit bg-red-600 text-white dark:bg-red-500"
              }
            >
              {unidad.estado === "activo" ? "Activa" : "Inactiva"}
            </Badge>
          )
        }
        headerActions={
          unidad && (
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirmando(true)}>
                {unidad.estado === "activo" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {unidad.estado === "activo" ? "Eliminar" : "Habilitar"}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </>
          )
        }
        tabs={
          unidad
            ? [
                {
                  value: "detalle",
                  label: "Detalle",
                  content: (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <InfoRow label="Abreviatura" value={unidad.abreviatura ?? "—"} />
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
                            description="Todavía ningún producto usa esta unidad de medida."
                          />
                        ) : (
                          <ul className="divide-y">
                            {productos.map((producto) => (
                              <li key={producto.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Package className="size-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <Link href={`/productos?ver=${producto.id}`} className="text-sm font-medium hover:underline">
                                      {producto.nombre}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                      Stock: {formatNumber(producto.stock_actual)}
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

      <UnidadMedidaFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        unidad={unidad}
        onSaved={(actualizada) => {
          setUnidad(actualizada);
          onChanged();
        }}
      />

      {unidad && (
        <ConfirmDialog
          open={confirmando}
          onOpenChange={setConfirmando}
          title={unidad.estado === "activo" ? "¿Eliminar esta unidad de medida?" : "¿Habilitar esta unidad de medida?"}
          description={
            unidad.estado === "activo"
              ? `"${unidad.nombre}" se marcará como inactiva. No se elimina físicamente ni afecta a los productos que ya la usan — puedes habilitarla de nuevo en cualquier momento.`
              : `"${unidad.nombre}" volverá a estar activa y disponible.`
          }
          confirmLabel={unidad.estado === "activo" ? "Eliminar" : "Habilitar"}
          destructive={unidad.estado === "activo"}
          onConfirm={cambiarEstado}
        />
      )}
    </>
  );
}
