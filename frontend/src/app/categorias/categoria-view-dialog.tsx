"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCategoriaDetail } from "@/hooks/use-categoria-detail";
import { fetchCategoria, fetchProductosDeCategoria } from "@/lib/api/categorias";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { Categoria, CategoriaProducto } from "@/types/categoria";

export function CategoriaViewDialog({
  categoriaId,
  onClose,
  canEdit,
  canDisable,
  togglingId,
  onEdit,
  onToggleEstado,
}: {
  categoriaId: number | null;
  onClose: () => void;
  canEdit: boolean;
  canDisable: boolean;
  togglingId: number | null;
  onEdit: (categoria: Categoria) => void;
  onToggleEstado: (categoria: Categoria) => Promise<void>;
}) {
  const { categoria, isLoading, error, setCategoria } = useCategoriaDetail(categoriaId);
  const [productos, setProductos] = useState<CategoriaProducto[] | null>(null);
  const [productosLoadedFor, setProductosLoadedFor] = useState<number | null>(null);
  const [productosError, setProductosError] = useState<string | null>(null);

  useEffect(() => {
    if (categoriaId === null) return;
    let ignore = false;
    fetchProductosDeCategoria(categoriaId)
      .then((data) => {
        if (ignore) return;
        setProductos(data);
        setProductosError(null);
        setProductosLoadedFor(categoriaId);
      })
      .catch((err) => {
        if (ignore) return;
        setProductosError(extractApiErrorMessage(err, "No se pudieron cargar los productos de esta categoría."));
        setProductosLoadedFor(categoriaId);
      });
    return () => {
      ignore = true;
    };
  }, [categoriaId]);

  const productosLoading = categoriaId !== null && productosLoadedFor !== categoriaId;

  // onToggleEstado swallows its own errors (surfaced via the page's toggleError alert) rather
  // than rejecting, so re-fetching afterward is the only way to tell whether the dialog's own
  // copy of the category — a separate fetch from the list — needs updating.
  async function handleToggle(target: Categoria) {
    await onToggleEstado(target);
    if (categoriaId !== null) {
      fetchCategoria(categoriaId).then(setCategoria).catch(() => {});
    }
  }

  return (
    <Dialog open={categoriaId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Categoría</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : categoria ? (
          <Tabs defaultValue="detalle">
            <TabsList>
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
            </TabsList>

            <TabsContent value="detalle" className="flex flex-col gap-5 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-foreground">{categoria.nombre}</span>
                {categoria.estado === "activo" ? (
                  <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
                ) : (
                  <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
                )}
              </div>

              {categoria.descripcion ? (
                <p className="text-sm text-muted-foreground">{categoria.descripcion}</p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Productos asociados" value={String(categoria.productos_count ?? 0)} />
                <Field label="Creado" value={formatDateTime(categoria.created_at)} />
                <Field label="Actualizado" value={formatDateTime(categoria.updated_at)} />
              </div>

              {canEdit || canDisable ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => onEdit(categoria)}>
                      Editar
                    </Button>
                  ) : null}
                  {(categoria.estado === "activo" ? canDisable : canEdit) ? (
                    <Button
                      variant={categoria.estado === "activo" ? "destructive" : "outline"}
                      className={
                        categoria.estado === "activo"
                          ? undefined
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }
                      size="sm"
                      disabled={togglingId === categoria.id}
                      onClick={() => handleToggle(categoria)}
                    >
                      {togglingId === categoria.id ? <Loader2 className="size-4 animate-spin" /> : null}
                      {categoria.estado === "activo" ? "Deshabilitar" : "Habilitar"}
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
                <p className="text-sm text-muted-foreground">Ningún producto tiene esta categoría asignada.</p>
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
