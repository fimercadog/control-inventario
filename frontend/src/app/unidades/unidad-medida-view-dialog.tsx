"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUnidadMedidaDetail } from "@/hooks/use-unidad-medida-detail";
import { fetchUnidadMedida, fetchProductosDeUnidadMedida } from "@/lib/api/unidades-medida";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { UnidadMedida, UnidadMedidaProducto } from "@/types/unidad-medida";

export function UnidadMedidaViewDialog({
  unidadMedidaId,
  onClose,
  canEdit,
  canDisable,
  togglingId,
  onEdit,
  onToggleEstado,
}: {
  unidadMedidaId: number | null;
  onClose: () => void;
  canEdit: boolean;
  canDisable: boolean;
  togglingId: number | null;
  onEdit: (unidad: UnidadMedida) => void;
  onToggleEstado: (unidad: UnidadMedida) => Promise<void>;
}) {
  const { unidadMedida, isLoading, error, setUnidadMedida } = useUnidadMedidaDetail(unidadMedidaId);
  const [productos, setProductos] = useState<UnidadMedidaProducto[] | null>(null);
  const [productosLoadedFor, setProductosLoadedFor] = useState<number | null>(null);
  const [productosError, setProductosError] = useState<string | null>(null);

  useEffect(() => {
    if (unidadMedidaId === null) return;
    let ignore = false;
    fetchProductosDeUnidadMedida(unidadMedidaId)
      .then((data) => {
        if (ignore) return;
        setProductos(data);
        setProductosError(null);
        setProductosLoadedFor(unidadMedidaId);
      })
      .catch((err) => {
        if (ignore) return;
        setProductosError(
          extractApiErrorMessage(err, "No se pudieron cargar los productos de esta unidad de medida.")
        );
        setProductosLoadedFor(unidadMedidaId);
      });
    return () => {
      ignore = true;
    };
  }, [unidadMedidaId]);

  const productosLoading = unidadMedidaId !== null && productosLoadedFor !== unidadMedidaId;

  // onToggleEstado swallows its own errors (surfaced via the page's toggleError alert) rather
  // than rejecting, so re-fetching afterward is the only way to tell whether the dialog's own
  // copy of the unit — a separate fetch from the list — needs updating.
  async function handleToggle(target: UnidadMedida) {
    await onToggleEstado(target);
    if (unidadMedidaId !== null) {
      fetchUnidadMedida(unidadMedidaId).then(setUnidadMedida).catch(() => {});
    }
  }

  return (
    <Dialog open={unidadMedidaId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unidad de medida</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : unidadMedida ? (
          <Tabs defaultValue="detalle">
            <TabsList>
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalle" className="flex flex-col gap-5 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-foreground">{unidadMedida.nombre}</span>
                {unidadMedida.estado === "activo" ? (
                  <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
                ) : (
                  <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Abreviatura" value={unidadMedida.abreviatura ?? "—"} />
                <Field label="Productos asociados" value={String(unidadMedida.productos_count ?? 0)} />
                <Field label="Creado" value={formatDateTime(unidadMedida.created_at)} />
                <Field label="Actualizado" value={formatDateTime(unidadMedida.updated_at)} />
              </div>

              {canEdit || canDisable ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => onEdit(unidadMedida)}>
                      Editar
                    </Button>
                  ) : null}
                  {(unidadMedida.estado === "activo" ? canDisable : canEdit) ? (
                    <Button
                      variant={unidadMedida.estado === "activo" ? "destructive" : "outline"}
                      className={
                        unidadMedida.estado === "activo"
                          ? undefined
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }
                      size="sm"
                      disabled={togglingId === unidadMedida.id}
                      onClick={() => handleToggle(unidadMedida)}
                    >
                      {togglingId === unidadMedida.id ? <Loader2 className="size-4 animate-spin" /> : null}
                      {unidadMedida.estado === "activo" ? "Deshabilitar" : "Habilitar"}
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
                <p className="text-sm text-muted-foreground">Ningún producto tiene esta unidad de medida asignada.</p>
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
                          {producto.marca ? ` · ${producto.marca}` : ""}
                          {producto.categoria ? ` · ${producto.categoria}` : ""}
                        </p>
                      </div>
                      {producto.estado === "activo" ? (
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
