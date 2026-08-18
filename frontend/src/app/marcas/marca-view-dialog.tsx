"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMarcaDetail } from "@/hooks/use-marca-detail";
import { fetchMarca, fetchProductosDeMarca } from "@/lib/api/marcas";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { Marca, MarcaProducto } from "@/types/marca";

export function MarcaViewDialog({
  marcaId,
  onClose,
  canEdit,
  canDisable,
  togglingId,
  onEdit,
  onToggleEstado,
}: {
  marcaId: number | null;
  onClose: () => void;
  canEdit: boolean;
  canDisable: boolean;
  togglingId: number | null;
  onEdit: (marca: Marca) => void;
  onToggleEstado: (marca: Marca) => Promise<void>;
}) {
  const { marca, isLoading, error, setMarca } = useMarcaDetail(marcaId);
  const [productos, setProductos] = useState<MarcaProducto[] | null>(null);
  const [productosLoadedFor, setProductosLoadedFor] = useState<number | null>(null);
  const [productosError, setProductosError] = useState<string | null>(null);

  useEffect(() => {
    if (marcaId === null) return;
    let ignore = false;
    fetchProductosDeMarca(marcaId)
      .then((data) => {
        if (ignore) return;
        setProductos(data);
        setProductosError(null);
        setProductosLoadedFor(marcaId);
      })
      .catch((err) => {
        if (ignore) return;
        setProductosError(extractApiErrorMessage(err, "No se pudieron cargar los productos de esta marca."));
        setProductosLoadedFor(marcaId);
      });
    return () => {
      ignore = true;
    };
  }, [marcaId]);

  const productosLoading = marcaId !== null && productosLoadedFor !== marcaId;

  // onToggleEstado swallows its own errors (surfaced via the page's toggleError alert) rather
  // than rejecting, so re-fetching afterward is the only way to tell whether the dialog's own
  // copy of the brand — a separate fetch from the list — needs updating.
  async function handleToggle(target: Marca) {
    await onToggleEstado(target);
    if (marcaId !== null) {
      fetchMarca(marcaId).then(setMarca).catch(() => {});
    }
  }

  return (
    <Dialog open={marcaId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marca</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : marca ? (
          <Tabs defaultValue="detalle">
            <TabsList>
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalle" className="flex flex-col gap-5 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-foreground">{marca.nombre}</span>
                {marca.estado === "activo" ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="outline">Inactivo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Productos asociados" value={String(marca.productos_count ?? 0)} />
                <Field label="Proveedores" value={marca.proveedores?.map((proveedor) => proveedor.nombre).join(", ") || "Sin proveedores asociados"} />
                <Field label="Creado" value={formatDateTime(marca.created_at)} />
                <Field label="Actualizado" value={formatDateTime(marca.updated_at)} />
              </div>

              {canEdit || canDisable ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => onEdit(marca)}>
                      Editar
                    </Button>
                  ) : null}
                  {(marca.estado === "activo" ? canDisable : canEdit) ? (
                    <Button
                      variant={marca.estado === "activo" ? "destructive" : "success"}
                      size="sm"
                      disabled={togglingId === marca.id}
                      onClick={() => handleToggle(marca)}
                    >
                      {togglingId === marca.id ? <Loader2 className="size-4 animate-spin" /> : null}
                      {marca.estado === "activo" ? "Deshabilitar" : "Habilitar"}
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
                <p className="text-sm text-muted-foreground">Ningún producto tiene esta marca asignada.</p>
              ) : (
                <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                  {productos.map((producto) => (
                    <li
                      key={producto.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {producto.codigo}
                          {producto.categoria ? ` · ${producto.categoria}` : ""}
                        </p>
                      </div>
                      {producto.estado === "activo" ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
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
