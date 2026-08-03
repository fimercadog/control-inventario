"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Award, Ban, CheckCircle2, Package, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { MarcaFormModal } from "@/components/marca-form-modal";
import { getMarca, disableMarca, enableMarca, listProductosDeMarca } from "@/lib/api/marcas";
import type { Marca, Producto } from "@/lib/api/types";
import { formatCurrency, formatNumber } from "@/lib/format";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/marcas/{id}` — ver/editar/deshabilitar una marca sin salir del
 * listado, que permanece visible detrás del modal.
 */
export function MarcaViewModal({
  marcaId,
  open,
  onOpenChange,
  onChanged,
}: {
  marcaId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [marca, setMarca] = useState<Marca | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || marcaId == null) return;
    setLoading(true);
    Promise.all([getMarca(marcaId), listProductosDeMarca(marcaId)])
      .then(([marcaResult, productosResult]) => {
        setMarca(marcaResult);
        setProductos(productosResult);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar la marca.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, marcaId, onOpenChange]);

  async function cambiarEstado() {
    if (!marca) return;
    const actualizada = marca.estado === "activo" ? await disableMarca(marca.id) : await enableMarca(marca.id);
    setMarca(actualizada);
    toast.success(actualizada.estado === "activo" ? "Marca habilitada" : "Marca deshabilitada");
    onChanged();
  }

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={Award}
        title={marca?.nombre ?? ""}
        loading={loading}
        badge={
          marca && (
            <Badge
              className={
                marca.estado === "activo"
                  ? "w-fit bg-emerald-600 text-white dark:bg-emerald-500"
                  : "w-fit bg-red-600 text-white dark:bg-red-500"
              }
            >
              {marca.estado === "activo" ? "Activa" : "Inactiva"}
            </Badge>
          )
        }
        headerActions={
          marca && (
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirmando(true)}>
                {marca.estado === "activo" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {marca.estado === "activo" ? "Eliminar" : "Habilitar"}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </>
          )
        }
        tabs={
          marca
            ? [
                {
                  value: "detalle",
                  label: "Detalle",
                  content: (
                    <div className="grid grid-cols-2 gap-4 pt-4">
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
                            description="Todavía ningún producto usa esta marca."
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

      <MarcaFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        marca={marca}
        onSaved={(actualizada) => {
          setMarca(actualizada);
          onChanged();
        }}
      />

      {marca && (
        <ConfirmDialog
          open={confirmando}
          onOpenChange={setConfirmando}
          title={marca.estado === "activo" ? "¿Eliminar esta marca?" : "¿Habilitar esta marca?"}
          description={
            marca.estado === "activo"
              ? `"${marca.nombre}" se marcará como inactiva. No se elimina físicamente ni afecta a los productos que ya la usan — puedes habilitarla de nuevo en cualquier momento.`
              : `"${marca.nombre}" volverá a estar activa y disponible.`
          }
          confirmLabel={marca.estado === "activo" ? "Eliminar" : "Habilitar"}
          destructive={marca.estado === "activo"}
          onConfirm={cambiarEstado}
        />
      )}
    </>
  );
}
