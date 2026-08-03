"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, CheckCircle2, Package, Pencil, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { ProveedorFormModal } from "@/components/proveedor-form-modal";
import { getProveedor, disableProveedor, enableProveedor, listProductosDeProveedor } from "@/lib/api/proveedores";
import type { ProductoProveedorAsociacion, Proveedor } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/proveedores/{id}` — ver/editar/deshabilitar un proveedor sin salir
 * del listado, que permanece visible detrás del modal.
 *
 * A diferencia del `SupplierDetailScreen` que reemplaza, deshabilitar
 * ahora pasa primero por `ConfirmDialog` — el patrón anterior mutaba
 * de inmediato al hacer clic, la única inconsistencia del proyecto con
 * el estándar "Delete/Disable -> Confirmation Modal" que este cambio
 * exige de forma pareja en los 8 módulos.
 */
export function ProveedorViewModal({
  proveedorId,
  open,
  onOpenChange,
  onChanged,
}: {
  proveedorId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [productosAsociados, setProductosAsociados] = useState<ProductoProveedorAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || proveedorId == null) return;
    setLoading(true);
    Promise.all([getProveedor(proveedorId), listProductosDeProveedor(proveedorId)])
      .then(([proveedorResult, productosResult]) => {
        setProveedor(proveedorResult);
        setProductosAsociados(productosResult);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar el proveedor.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, proveedorId, onOpenChange]);

  async function cambiarEstado() {
    if (!proveedor) return;
    const actualizado =
      proveedor.estado === "activo" ? await disableProveedor(proveedor.id) : await enableProveedor(proveedor.id);
    setProveedor(actualizado);
    toast.success(actualizado.estado === "activo" ? "Proveedor habilitado" : "Proveedor deshabilitado");
    onChanged();
  }

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={Truck}
        title={proveedor?.nombre ?? ""}
        loading={loading}
        badge={
          proveedor && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {proveedor.nit && <span>NIT: {proveedor.nit}</span>}
              <Badge variant={proveedor.estado === "activo" ? "outline" : "secondary"}>
                {proveedor.estado === "activo" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          )
        }
        headerActions={
          proveedor && (
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirmando(true)}>
                {proveedor.estado === "activo" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {proveedor.estado === "activo" ? "Deshabilitar" : "Habilitar"}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </>
          )
        }
        size="lg"
        tabs={
          proveedor
            ? [
                {
                  value: "detalle",
                  label: "Detalle",
                  content: (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <InfoRow label="Contacto" value={proveedor.contacto ?? "—"} />
                      <InfoRow label="Teléfono" value={proveedor.telefono ?? "—"} />
                      <InfoRow label="Email" value={proveedor.email ?? "—"} />
                      <InfoRow label="Dirección" value={proveedor.direccion ?? "—"} />
                      <InfoRow label="Ciudad" value={proveedor.ciudad ?? "—"} />
                      <InfoRow label="País" value={proveedor.pais ?? "—"} />
                      <InfoRow label="Notas" value={proveedor.notas ?? "—"} />
                    </div>
                  ),
                },
                {
                  value: "productos",
                  label: `Productos (${productosAsociados.length})`,
                  content: (
                    <Card className="border-border/60 py-0">
                      <CardContent className="px-0">
                        {productosAsociados.length === 0 ? (
                          <EmptyState
                            icon={Package}
                            title="Sin productos asociados"
                            description="Este proveedor todavía no está asociado a ningún producto. La asociación se crea desde la ficha del producto."
                          />
                        ) : (
                          <ul className="divide-y">
                            {productosAsociados.map((asociacion) => (
                              <li key={asociacion.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Package className="size-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <Link
                                      href={`/productos/${asociacion.producto_id}`}
                                      className="flex items-center gap-2 text-sm font-medium hover:underline"
                                    >
                                      {asociacion.producto_nombre}
                                      {asociacion.es_principal && <Badge variant="outline">Principal</Badge>}
                                    </Link>
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

      <ProveedorFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        proveedor={proveedor}
        onSaved={(actualizado) => {
          setProveedor(actualizado);
          onChanged();
        }}
      />

      {proveedor && (
        <ConfirmDialog
          open={confirmando}
          onOpenChange={setConfirmando}
          title={proveedor.estado === "activo" ? "¿Deshabilitar este proveedor?" : "¿Habilitar este proveedor?"}
          description={
            proveedor.estado === "activo"
              ? `"${proveedor.nombre}" se marcará como inactivo. No se elimina físicamente ni afecta a los productos ya asociados — puedes habilitarlo de nuevo en cualquier momento.`
              : `"${proveedor.nombre}" volverá a estar activo y disponible.`
          }
          confirmLabel={proveedor.estado === "activo" ? "Deshabilitar" : "Habilitar"}
          destructive={proveedor.estado === "activo"}
          onConfirm={cambiarEstado}
        />
      )}
    </>
  );
}
