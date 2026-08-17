"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProductoDetail } from "@/hooks/use-producto-detail";
import { usePermission } from "@/hooks/use-permission";
import { fetchProducto, habilitarProducto, deshabilitarProducto, fetchMovimientosDeProducto } from "@/lib/api/productos";
import { fetchProveedoresDeProducto, deshabilitarAsociacion } from "@/lib/api/producto-proveedor";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import { ProductoForm } from "@/components/forms/producto-form";
import { RegistrarIngresoForm } from "@/components/forms/registrar-ingreso-form";
import { ProductoProveedorForm } from "@/components/forms/producto-proveedor-form";
import type { Producto, ProductoMovimiento } from "@/types/producto";
import type { ProductoProveedorAsociacion } from "@/types/producto-proveedor";
import type { PaginationMeta } from "@/types/api";

export default function ProductoFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productoId = Number(id);

  const canEdit = usePermission("productos.editar");
  const canDisable = usePermission("productos.gestionar");
  const canManageProveedores = usePermission("producto-proveedor.crear");
  const canDisableProveedores = usePermission("producto-proveedor.gestionar");

  const { producto, isLoading, error, setProducto } = useProductoDetail(productoId);
  const [toggleStatus, setToggleStatus] = useState<"idle" | "toggling">("idle");
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [ingresoOpen, setIngresoOpen] = useState(false);

  async function handleToggle() {
    if (!producto) return;
    setToggleStatus("toggling");
    setToggleError(null);
    try {
      const updated = producto.estado === "activo" ? await deshabilitarProducto(producto.id) : await habilitarProducto(producto.id);
      setProducto(updated);
    } catch (err) {
      setToggleError(extractApiErrorMessage(err, "No se pudo actualizar el estado del producto."));
    } finally {
      setToggleStatus("idle");
    }
  }

  function handleEdited(updated: Producto) {
    setProducto(updated);
    setEditOpen(false);
  }

  function handleIngresoRegistrado(updated: Producto) {
    setProducto(updated);
    setIngresoOpen(false);
    fetchProducto(productoId).then(setProducto).catch(() => {});
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!producto) return null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/productos" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver a Productos
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{producto.nombre}</h1>
            {producto.estado === "activo" ? (
              <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
            ) : (
              <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
            )}
          </div>
          {producto.codigo ? <p className="text-sm text-muted-foreground">Código: {producto.codigo}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Dialog open={ingresoOpen} onOpenChange={setIngresoOpen}>
              <DialogTrigger render={<Button variant="outline" />}>
                <Plus className="size-4" />
                Registrar ingreso
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar ingreso</DialogTitle>
                  <DialogDescription>Aumenta el stock de {producto.nombre}.</DialogDescription>
                </DialogHeader>
                <RegistrarIngresoForm producto={producto} onSuccess={handleIngresoRegistrado} />
              </DialogContent>
            </Dialog>
          ) : null}
          {canEdit ? (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger render={<Button variant="outline" />}>Editar</DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar producto</DialogTitle>
                  <DialogDescription>Código y código de barras no son editables.</DialogDescription>
                </DialogHeader>
                <ProductoForm producto={producto} onSuccess={handleEdited} />
              </DialogContent>
            </Dialog>
          ) : null}
          {(producto.estado === "activo" ? canDisable : canEdit) ? (
            <Button
              variant={producto.estado === "activo" ? "destructive" : "outline"}
              className={
                producto.estado === "activo"
                  ? undefined
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }
              disabled={toggleStatus === "toggling"}
              onClick={handleToggle}
            >
              {toggleStatus === "toggling" ? <Loader2 className="size-4 animate-spin" /> : null}
              {producto.estado === "activo" ? "Deshabilitar" : "Habilitar"}
            </Button>
          ) : null}
        </div>
      </div>

      {toggleError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{toggleError}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="detalle">
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle" className="pt-4">
          <DetalleTab producto={producto} />
        </TabsContent>

        <TabsContent value="movimientos" className="pt-4">
          <MovimientosTab productoId={producto.id} />
        </TabsContent>

        <TabsContent value="proveedores" className="pt-4">
          <ProveedoresTab
            productoId={producto.id}
            canManage={canManageProveedores}
            canDisable={canDisableProveedores}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetalleTab({ producto }: { producto: Producto }) {
  const stockBajo = producto.stock_actual <= producto.stock_minimo;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Marca" value={producto.marca ?? "—"} />
        <Field label="Categoría" value={producto.categoria ?? "—"} />
        <Field label="Unidad de medida" value={producto.unidad_medida ?? "—"} />
        <Field label="Presentación" value={producto.presentacion ?? "—"} />
        <Field label="Código de barras" value={producto.codigo_barras ?? "—"} />
        <Field label="Costo" value={producto.costo.toLocaleString("es-CO", { style: "currency", currency: "COP" })} />
        <Field label="Precio" value={producto.precio.toLocaleString("es-CO", { style: "currency", currency: "COP" })} />
        <Field
          label="Stock actual"
          value={String(producto.stock_actual)}
          className={stockBajo ? "font-semibold text-amber-500" : undefined}
        />
        <Field label="Stock mínimo" value={String(producto.stock_minimo)} />
        <Field label="Stock máximo" value={producto.stock_maximo != null ? String(producto.stock_maximo) : "—"} />
        <Field label="Creado" value={formatDateTime(producto.created_at)} />
        <Field label="Actualizado" value={formatDateTime(producto.updated_at)} />
      </div>
      {producto.descripcion ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</p>
          <p className="text-sm text-foreground">{producto.descripcion}</p>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        El stock actual es de solo lectura — solo cambia mediante Movimientos (Registrar ingreso), nunca editando
        este campo directamente.
      </p>
    </div>
  );
}

const TIPO_LABEL: Record<string, string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" };

function MovimientosTab({ productoId }: { productoId: number }) {
  const [movimientos, setMovimientos] = useState<ProductoMovimiento[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // Derived-staleness pattern (same as use-categoria-detail.ts etc.): tracks what
  // {productoId, page} pair the current `movimientos` actually reflects, instead of an
  // imperative setMovimientos(null) inside the effect (React Compiler's set-state-in-effect
  // rule flags synchronous setState calls in an effect body).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const requestKey = `${productoId}:${page}`;

  useEffect(() => {
    let ignore = false;
    fetchMovimientosDeProducto(productoId, page)
      .then((data) => {
        if (ignore) return;
        setMovimientos(data.items);
        setMeta(data.meta);
        setError(null);
        setLoadedFor(requestKey);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudieron cargar los movimientos."));
        setLoadedFor(requestKey);
      });
    return () => {
      ignore = true;
    };
  }, [productoId, page, requestKey]);

  const isLoading = loadedFor !== requestKey;

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }

  if (movimientos.length === 0) {
    return <p className="text-sm text-muted-foreground">Este producto no tiene movimientos registrados.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {movimientos.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                {TIPO_LABEL[m.tipo] ?? m.tipo} · {m.delta >= 0 ? "+" : ""}
                {m.delta}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(m.created_at)}
                {m.usuario ? ` · ${m.usuario}` : ""}
                {m.proveedor ? ` · ${m.proveedor}` : ""}
                {m.documento ? ` · ${m.documento}` : ""}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {m.stock_anterior} → {m.stock_nuevo}
            </span>
          </li>
        ))}
      </ul>
      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {meta.current_page} de {meta.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ProveedoresTab({
  productoId,
  canManage,
  canDisable,
}: {
  productoId: number;
  canManage: boolean;
  canDisable: boolean;
}) {
  const [asociaciones, setAsociaciones] = useState<ProductoProveedorAsociacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [disablingId, setDisablingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function reload() {
    fetchProveedoresDeProducto(productoId)
      .then((data) => {
        setAsociaciones(data);
        setError(null);
      })
      .catch((err) => setError(extractApiErrorMessage(err, "No se pudieron cargar los proveedores asociados.")));
  }

  useEffect(reload, [productoId]);

  async function handleDisable(asociacionId: number) {
    setDisablingId(asociacionId);
    setActionError(null);
    try {
      await deshabilitarAsociacion(productoId, asociacionId);
      reload();
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "No se pudo deshabilitar la asociación."));
    } finally {
      setDisablingId(null);
    }
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (asociaciones === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canManage ? (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="w-fit" />}>
            <Plus className="size-4" />
            Asociar proveedor
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asociar proveedor</DialogTitle>
            </DialogHeader>
            <ProductoProveedorForm
              productoId={productoId}
              yaAsociados={asociaciones.map((a) => a.proveedor_id)}
              onSuccess={() => {
                setAddOpen(false);
                reload();
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {actionError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {asociaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este producto no tiene proveedores asociados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {asociaciones.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {a.proveedor_nombre}
                  {a.es_principal ? (
                    <Badge className="ml-2 border-indigo-500/40 bg-indigo-500/15 text-indigo-400">Principal</Badge>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.codigo_proveedor ? `Código: ${a.codigo_proveedor}` : ""}
                  {a.precio_compra != null
                    ? `${a.codigo_proveedor ? " · " : ""}Precio de compra: ${a.precio_compra.toLocaleString("es-CO", { style: "currency", currency: "COP" })}`
                    : ""}
                </p>
              </div>
              {canDisable && a.estado === "activo" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={disablingId === a.id}
                  onClick={() => handleDisable(a.id)}
                >
                  {disablingId === a.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  Deshabilitar
                </Button>
              ) : (
                <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">
                  {a.estado === "activo" ? "Activo" : "Inactivo"}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={className ?? "text-sm text-foreground"}>{value}</p>
    </div>
  );
}
