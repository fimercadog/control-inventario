"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProveedorDetail } from "@/hooks/use-proveedor-detail";
import { fetchProveedor, fetchProductosDelProveedor } from "@/lib/api/proveedores";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { Proveedor, ProveedorProducto } from "@/types/proveedor";

export function ProveedorViewDialog({
  proveedorId,
  onClose,
  canEdit,
  canDisable,
  togglingId,
  onEdit,
  onToggleEstado,
}: {
  proveedorId: number | null;
  onClose: () => void;
  canEdit: boolean;
  canDisable: boolean;
  togglingId: number | null;
  onEdit: (proveedor: Proveedor) => void;
  onToggleEstado: (proveedor: Proveedor) => Promise<void>;
}) {
  const { proveedor, isLoading, error, setProveedor } = useProveedorDetail(proveedorId);
  const [productos, setProductos] = useState<ProveedorProducto[] | null>(null);
  const [productosLoadedFor, setProductosLoadedFor] = useState<number | null>(null);
  const [productosError, setProductosError] = useState<string | null>(null);

  useEffect(() => {
    if (proveedorId === null) return;
    let ignore = false;
    fetchProductosDelProveedor(proveedorId)
      .then((data) => {
        if (ignore) return;
        setProductos(data);
        setProductosError(null);
        setProductosLoadedFor(proveedorId);
      })
      .catch((err) => {
        if (ignore) return;
        setProductosError(extractApiErrorMessage(err, "No se pudieron cargar los productos de este proveedor."));
        setProductosLoadedFor(proveedorId);
      });
    return () => {
      ignore = true;
    };
  }, [proveedorId]);

  const productosLoading = proveedorId !== null && productosLoadedFor !== proveedorId;

  // onToggleEstado swallows its own errors (surfaced via the page's toggleError alert) rather
  // than rejecting, so re-fetching afterward is the only way to tell whether the dialog's own
  // copy of the proveedor — a separate fetch from the list — needs updating.
  async function handleToggle(target: Proveedor) {
    await onToggleEstado(target);
    if (proveedorId !== null) {
      fetchProveedor(proveedorId).then(setProveedor).catch(() => {});
    }
  }

  return (
    <Dialog open={proveedorId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proveedor</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : proveedor ? (
          <Tabs defaultValue="detalle">
            <TabsList>
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalle" className="flex flex-col gap-5 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-foreground">{proveedor.nombre}</span>
                {proveedor.estado === "activo" ? (
                  <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
                ) : (
                  <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="NIT" value={proveedor.nit ?? "—"} />
                <Field label="Email" value={proveedor.email ?? "—"} />
                <Field label="Contacto" value={proveedor.contacto ?? "—"} />
                <Field label="Teléfono" value={proveedor.telefono ?? "—"} />
                <Field label="Dirección" value={proveedor.direccion ?? "—"} />
                <Field label="Ciudad" value={[proveedor.ciudad, proveedor.pais].filter(Boolean).join(", ") || "—"} />
              </div>

              {proveedor.notas ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas</p>
                  <p className="text-sm text-foreground">{proveedor.notas}</p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Creado" value={formatDateTime(proveedor.created_at)} />
                <Field label="Actualizado" value={formatDateTime(proveedor.updated_at)} />
              </div>

              {canEdit || canDisable ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => onEdit(proveedor)}>
                      Editar
                    </Button>
                  ) : null}
                  {(proveedor.estado === "activo" ? canDisable : canEdit) ? (
                    <Button
                      variant={proveedor.estado === "activo" ? "destructive" : "outline"}
                      className={
                        proveedor.estado === "activo"
                          ? undefined
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }
                      size="sm"
                      disabled={togglingId === proveedor.id}
                      onClick={() => handleToggle(proveedor)}
                    >
                      {togglingId === proveedor.id ? <Loader2 className="size-4 animate-spin" /> : null}
                      {proveedor.estado === "activo" ? "Deshabilitar" : "Habilitar"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="productos" className="pt-4">
              {productosError ? (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{productosError}</AlertDescription>
                </Alert>
              ) : productosLoading || productos === null ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando" />
                </div>
              ) : productos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este proveedor no tiene productos asociados.</p>
              ) : (
                <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                  {productos.map((asociacion) => (
                    <li
                      key={asociacion.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {asociacion.producto_nombre ?? "—"}
                          {asociacion.es_principal ? (
                            <Badge variant="outline" className="text-xs">
                              Principal
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asociacion.codigo_proveedor ? `Código: ${asociacion.codigo_proveedor}` : null}
                          {asociacion.precio_compra !== null
                            ? `${asociacion.codigo_proveedor ? " · " : ""}Compra: $${asociacion.precio_compra.toFixed(2)}`
                            : null}
                        </p>
                      </div>
                      {asociacion.estado === "activo" ? (
                        <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">
                          Inactivo
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
