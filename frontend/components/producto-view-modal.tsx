"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Package, PackageX, Pencil, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { ProductoFormModal } from "@/components/producto-form-modal";
import { MovementTypeBadge } from "@/components/movement-type-badge";
import { RegistrarIngresoDialog } from "@/components/registrar-ingreso-dialog";
import { ProductSupplierDialog } from "@/components/product-supplier-dialog";
import {
  getProducto,
  disableProducto,
  enableProducto,
  getMovimientosDeProducto,
  listProveedoresDeProducto,
  deshabilitarAsociacionProveedor,
} from "@/lib/api/productos";
import type { MovimientoProducto, Producto, ProductoProveedorAsociacion } from "@/lib/api/types";
import type { MovementType } from "@/lib/types";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/productos/{id}` — el módulo más complejo de los 8 (3 pestañas,
 * kardex en vivo, sub-CRUD anidado de proveedores asociados), por eso
 * usa el tamaño `xl` del `DetailModal`. `RegistrarIngresoDialog` y
 * `ProductSupplierDialog` son diálogos ya existentes, sin cambios —
 * solo se reubican aquí dentro, exactamente como ya se usaban en
 * `ProductDetailScreen`.
 */
export function ProductoViewModal({
  productoId,
  open,
  onOpenChange,
  onChanged,
}: {
  productoId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoProducto[]>([]);
  const [proveedoresAsociados, setProveedoresAsociados] = useState<ProductoProveedorAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || productoId == null) return;
    setLoading(true);
    Promise.all([
      getProducto(productoId),
      getMovimientosDeProducto(productoId),
      listProveedoresDeProducto(productoId),
    ])
      .then(([productoResult, movimientosResult, proveedoresResult]) => {
        setProducto(productoResult);
        setMovimientos(movimientosResult.items);
        setProveedoresAsociados(proveedoresResult);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar el producto.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, productoId, onOpenChange]);

  async function cambiarEstado() {
    if (!producto) return;
    const actualizado =
      producto.estado === "activo" ? await disableProducto(producto.id) : await enableProducto(producto.id);
    setProducto(actualizado);
    toast.success(actualizado.estado === "activo" ? "Producto habilitado" : "Producto deshabilitado");
    onChanged();
  }

  function handleIngresoRegistrado(actualizado: Producto) {
    setProducto(actualizado);
    onChanged();
    getMovimientosDeProducto(actualizado.id)
      .then((result) => setMovimientos(result.items))
      .catch(() => {
        // El producto ya se actualizó; si esta recarga puntual falla, no
        // bloquea el flujo — el usuario puede reabrir la pestaña.
      });
  }

  function handleAsociacionGuardada(asociacion: ProductoProveedorAsociacion) {
    setProveedoresAsociados((actual) => {
      const otras = actual.filter((a) => a.id !== asociacion.id);
      const conPrincipalActualizado = asociacion.es_principal
        ? otras.map((a) => ({ ...a, es_principal: false }))
        : otras;
      return [...conPrincipalActualizado, asociacion];
    });
  }

  async function handleDeshabilitarAsociacion(asociacion: ProductoProveedorAsociacion) {
    if (!producto) return;
    try {
      await deshabilitarAsociacionProveedor(producto.id, asociacion.id);
      setProveedoresAsociados((actual) => actual.filter((a) => a.id !== asociacion.id));
      toast.success("Asociación deshabilitada correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos deshabilitar la asociación.");
    }
  }

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={Package}
        title={producto?.nombre ?? ""}
        loading={loading}
        size="xl"
        badge={
          producto && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {producto.codigo && <span>Código: {producto.codigo}</span>}
              {producto.categoria && <Badge variant="secondary">{producto.categoria}</Badge>}
              <Badge
                className={
                  producto.estado === "activo"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500"
                    : "bg-red-600 text-white dark:bg-red-500"
                }
              >
                {producto.estado === "activo" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          )
        }
        headerActions={
          producto && (
            <>
              <RegistrarIngresoDialog
                productoId={producto.id}
                proveedorPrincipal={proveedoresAsociados.find((a) => a.es_principal)}
                onRegistered={handleIngresoRegistrado}
              />
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirmando(true)}>
                {producto.estado === "activo" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {producto.estado === "activo" ? "Eliminar" : "Habilitar"}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </>
          )
        }
        tabs={
          producto
            ? [
                {
                  value: "detalle",
                  label: "Detalle",
                  content: (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <InfoRow label="Marca" value={producto.marca ?? "—"} />
                      <InfoRow label="Presentación" value={producto.presentacion ?? "—"} />
                      <InfoRow label="Descripción" value={producto.descripcion ?? "—"} />
                      <InfoRow label="Unidad de medida" value={producto.unidad_medida ?? "—"} />
                      <InfoRow label="Costo" value={formatCurrency(producto.costo)} />
                      <InfoRow label="Precio" value={formatCurrency(producto.precio)} />
                      <InfoRow label="Stock actual" value={formatNumber(producto.stock_actual)} emphasize />
                      <InfoRow
                        label="Stock mínimo / máximo"
                        value={`${formatNumber(producto.stock_minimo)} / ${producto.stock_maximo !== null ? formatNumber(producto.stock_maximo) : "—"}`}
                      />
                    </div>
                  ),
                },
                {
                  value: "movimientos",
                  label: `Movimientos (${movimientos.length})`,
                  content: (
                    <Card className="border-border/60 py-0">
                      <CardContent className="px-0">
                        {movimientos.length === 0 ? (
                          <EmptyState
                            icon={PackageX}
                            title="Sin movimientos todavía"
                            description="Este producto no tiene entradas ni salidas registradas."
                          />
                        ) : (
                          <ul className="divide-y">
                            {movimientos.map((mov) => {
                              const detalles = [
                                mov.documento && `Factura: ${mov.documento}`,
                                mov.proveedor && `Proveedor: ${mov.proveedor}`,
                                mov.lote && `Lote: ${mov.lote}`,
                                mov.vencimiento && `Vence: ${mov.vencimiento}`,
                              ].filter(Boolean);

                              return (
                                <li key={mov.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <MovementTypeBadge tipo={mov.tipo as MovementType} />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">
                                        {formatNumber(mov.cantidad)} {producto.unidad_medida?.toLowerCase()}
                                      </span>
                                      {mov.observacion && (
                                        <span className="text-xs text-muted-foreground">{mov.observacion}</span>
                                      )}
                                      {detalles.length > 0 && (
                                        <span className="text-xs text-muted-foreground">{detalles.join(" · ")}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end text-xs text-muted-foreground">
                                    <span>
                                      {formatNumber(mov.stock_anterior)} → {formatNumber(mov.stock_nuevo)}
                                    </span>
                                    {mov.created_at && <span>{formatRelativeTime(mov.created_at)}</span>}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ),
                },
                {
                  value: "proveedores",
                  label: `Proveedores (${proveedoresAsociados.length})`,
                  content: (
                    <Card className="border-border/60 py-0">
                      <CardContent className="px-0">
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                          <p className="text-xs text-muted-foreground">
                            Proveedores asociados a este producto. El ingreso manual usa el proveedor principal por
                            defecto.
                          </p>
                          <ProductSupplierDialog
                            productoId={producto.id}
                            proveedoresYaAsociados={proveedoresAsociados.map((a) => a.proveedor_id)}
                            onSaved={handleAsociacionGuardada}
                          />
                        </div>
                        {proveedoresAsociados.length === 0 ? (
                          <EmptyState
                            icon={Truck}
                            title="Sin proveedores asociados"
                            description="Asocia un proveedor para poder seleccionarlo como principal en el ingreso manual."
                          />
                        ) : (
                          <ul className="divide-y">
                            {proveedoresAsociados.map((asociacion) => (
                              <li key={asociacion.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Truck className="size-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                      {asociacion.proveedor_nombre}
                                      {asociacion.es_principal && <Badge variant="outline">Principal</Badge>}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {[
                                        asociacion.codigo_proveedor && `Código: ${asociacion.codigo_proveedor}`,
                                        asociacion.precio_compra != null &&
                                          `Precio de compra: ${formatCurrency(asociacion.precio_compra)}`,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ") || "Sin datos adicionales"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ProductSupplierDialog
                                    productoId={producto.id}
                                    asociacion={asociacion}
                                    proveedoresYaAsociados={proveedoresAsociados.map((a) => a.proveedor_id)}
                                    onSaved={handleAsociacionGuardada}
                                  />
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label="Deshabilitar asociación"
                                    onClick={() => handleDeshabilitarAsociacion(asociacion)}
                                  >
                                    <Ban className="size-4" />
                                  </Button>
                                </div>
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

      <ProductoFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        producto={producto}
        onSaved={(actualizado) => {
          setProducto(actualizado);
          onChanged();
        }}
      />

      {producto && (
        <ConfirmDialog
          open={confirmando}
          onOpenChange={setConfirmando}
          title={producto.estado === "activo" ? "¿Eliminar este producto?" : "¿Habilitar este producto?"}
          description={
            producto.estado === "activo"
              ? `"${producto.nombre}" se marcará como inactivo. No se elimina físicamente ni se pierde su historial de movimientos — puedes habilitarlo de nuevo en cualquier momento.`
              : `"${producto.nombre}" volverá a estar activo y visible en el catálogo.`
          }
          confirmLabel={producto.estado === "activo" ? "Eliminar" : "Habilitar"}
          destructive={producto.estado === "activo"}
          onConfirm={cambiarEstado}
        />
      )}
    </>
  );
}
