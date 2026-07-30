"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  Package,
  PackageX,
  Pencil,
  Save,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MovementTypeBadge } from "@/components/movement-type-badge";
import { RegistrarIngresoDialog } from "@/components/registrar-ingreso-dialog";
import { ProductSupplierDialog } from "@/components/product-supplier-dialog";
import {
  getProducto,
  updateProducto,
  disableProducto,
  enableProducto,
  getMovimientosDeProducto,
  listProveedoresDeProducto,
  deshabilitarAsociacionProveedor,
} from "@/lib/api/productos";
import type {
  MovimientoProducto,
  Producto,
  ProductoProveedorAsociacion,
  UpdateProductoPayload,
} from "@/lib/api/types";
import type { MovementType } from "@/lib/types";
import { colorFromString } from "@/lib/color-from-string";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";

/**
 * Ficha de producto (docs/03_FUNCTIONAL_SPEC/Products.md, adenda "Ficha
 * de Producto") — único destino de navegación para el detalle de un
 * producto, sin importar desde qué pantalla se llega. `stock_actual`
 * nunca es editable aquí: es propiedad exclusiva de InventoryService.
 */
export function ProductDetailScreen({ productId }: { productId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoProducto[]>([]);
  const [proveedoresAsociados, setProveedoresAsociados] = useState<ProductoProveedorAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(searchParams.get("editar") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateProductoPayload>({});
  const [confirmandoCambioEstado, setConfirmandoCambioEstado] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(productId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    Promise.all([
      getProducto(productId),
      getMovimientosDeProducto(productId),
      listProveedoresDeProducto(productId),
    ])
      .then(([productoResult, movimientosResult, proveedoresResult]) => {
        setProducto(productoResult);
        setMovimientos(movimientosResult.items);
        setProveedoresAsociados(proveedoresResult);
        setForm({
          nombre: productoResult.nombre,
          marca_nuevo: productoResult.marca ?? "",
          descripcion: productoResult.descripcion ?? "",
          presentacion: productoResult.presentacion ?? "",
          costo: productoResult.costo,
          precio: productoResult.precio,
          unidad_medida_nuevo: productoResult.unidad_medida ?? "",
          stock_minimo: productoResult.stock_minimo,
          stock_maximo: productoResult.stock_maximo,
          estado: productoResult.estado,
        });
      })
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el producto.");
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function save() {
    if (!producto) return;
    setSaving(true);
    try {
      const updated = await updateProducto(producto.id, form);
      setProducto(updated);
      setEditing(false);
      toast.success("Producto actualizado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  /**
   * FEATURE-002: el endpoint de ingreso devuelve el producto ya con el
   * stock actualizado. "Actualiza Kardex" se satisface re-consultando los
   * movimientos — la pestaña ya construida (Adenda 1) refleja el nuevo
   * registro sin necesitar una pantalla de Kardex aparte.
   */
  function handleIngresoRegistrado(actualizado: Producto) {
    setProducto(actualizado);
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
      // FEATURE-005: un único proveedor principal activo — si esta
      // asociación quedó marcada como principal, se refleja también
      // aquí sin esperar un refetch completo.
      const conPrincipalActualizado = asociacion.es_principal
        ? otras.map((a) => ({ ...a, es_principal: false }))
        : otras;
      return [...conPrincipalActualizado, asociacion];
    });
  }

  async function cambiarEstado() {
    if (!producto) return;
    try {
      const actualizado =
        producto.estado === "activo"
          ? await disableProducto(producto.id)
          : await enableProducto(producto.id);
      setProducto(actualizado);
      toast.success(actualizado.estado === "activo" ? "Producto habilitado" : "Producto deshabilitado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando producto...
      </div>
    );
  }

  if (notFound || !producto) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/productos")}>
          <ArrowLeft className="size-4" />
          Volver a Productos
        </Button>
        <EmptyState
          icon={PackageX}
          title="No encontramos este producto"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/productos")}>
          <ArrowLeft className="size-4" />
          Volver a Productos
        </Button>
        {!editing && (
          <div className="flex items-center gap-2">
            <RegistrarIngresoDialog
              productoId={producto.id}
              proveedorPrincipal={proveedoresAsociados.find((a) => a.es_principal)}
              onRegistered={handleIngresoRegistrado}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setConfirmandoCambioEstado(true)}
            >
              {producto.estado === "activo" ? (
                <>
                  <Ban className="size-4" />
                  Eliminar
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Habilitar
                </>
              )}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: colorFromString(producto.nombre) }}
        >
          <Package className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{producto.nombre}</h1>
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
        </div>
      </div>

      <Tabs defaultValue={searchParams.get("tab") === "movimientos" ? "movimientos" : "detalle"}>
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos ({movimientos.length})</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores ({proveedoresAsociados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle">
          <Card className="border-border/60">
            <CardContent className="flex flex-col gap-4 pt-6">
              {editing ? (
                <>
                  <Field label="Nombre">
                    <Input
                      value={form.nombre ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Marca">
                      <Input
                        value={form.marca_nuevo ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, marca_nuevo: e.target.value }))}
                      />
                    </Field>
                    <Field label="Presentación">
                      <Input
                        value={form.presentacion ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, presentacion: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <Field label="Descripción">
                    <Input
                      value={form.descripcion ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Costo">
                      <Input
                        type="number"
                        min={0}
                        value={form.costo ?? 0}
                        onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) }))}
                      />
                    </Field>
                    <Field label="Precio">
                      <Input
                        type="number"
                        min={0}
                        value={form.precio ?? 0}
                        onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Stock mínimo">
                      <Input
                        type="number"
                        min={0}
                        value={form.stock_minimo ?? 0}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, stock_minimo: Number(e.target.value) }))
                        }
                      />
                    </Field>
                    <Field label="Stock máximo">
                      <Input
                        type="number"
                        min={0}
                        value={form.stock_maximo ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            stock_maximo: e.target.value === "" ? null : Number(e.target.value),
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Unidad de medida">
                    <Input
                      value={form.unidad_medida_nuevo ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, unidad_medida_nuevo: e.target.value }))}
                    />
                  </Field>
                  <Field label="Stock actual">
                    <Input type="text" value={formatNumber(producto.stock_actual)} disabled />
                  </Field>
                  <p className="text-xs text-muted-foreground">
                    El stock actual no es editable aquí — solo se modifica mediante un movimiento
                    de inventario real (Entrada/Salida/Ajuste desde &quot;Registrar ingreso&quot; o
                    Captura IA), nunca desde este formulario.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      <X className="size-4" />
                      Cancelar
                    </Button>
                    <Button className="flex-1 gap-2" onClick={save} disabled={saving}>
                      <Save className="size-4" />
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Marca" value={producto.marca ?? "—"} />
                  <InfoRow label="Presentación" value={producto.presentacion ?? "—"} />
                  <InfoRow label="Descripción" value={producto.descripcion ?? "—"} />
                  <InfoRow label="Unidad de medida" value={producto.unidad_medida ?? "—"} />
                  <InfoRow label="Costo" value={formatCurrency(producto.costo)} />
                  <InfoRow label="Precio" value={formatCurrency(producto.precio)} />
                  <InfoRow label="Stock actual" value={formatNumber(producto.stock_actual)} emphasize />
                  <InfoRow label="Stock mínimo / máximo" value={`${formatNumber(producto.stock_minimo)} / ${producto.stock_maximo !== null ? formatNumber(producto.stock_maximo) : "—"}`} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimientos">
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
                    // FEATURE-002: proveedor/factura/lote/vencimiento son
                    // descriptivos del ingreso manual (docs/03_FUNCTIONAL_SPEC/Products.md,
                    // Adenda 2) — se muestran solo cuando existen (movimientos
                    // de Captura IA no los tienen).
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
                              <span className="text-xs text-muted-foreground">
                                {detalles.join(" · ")}
                              </span>
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
        </TabsContent>

        <TabsContent value="proveedores">
          <Card className="border-border/60 py-0">
            <CardContent className="px-0">
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Proveedores asociados a este producto. El ingreso manual usa el proveedor
                  principal por defecto.
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
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmandoCambioEstado}
        onOpenChange={setConfirmandoCambioEstado}
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
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-medium" : undefined}>{value}</span>
    </div>
  );
}
