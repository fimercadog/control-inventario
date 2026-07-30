"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle2, Loader2, Package, Pencil, Ruler, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  getUnidadMedida,
  updateUnidadMedida,
  disableUnidadMedida,
  enableUnidadMedida,
  listProductosDeUnidadMedida,
} from "@/lib/api/unidades-medida";
import type { Producto, UnidadMedida, UpdateUnidadMedidaPayload } from "@/lib/api/types";
import { formatCurrency, formatNumber } from "@/lib/format";

/**
 * Ficha de Unidad de Medida (RC1, docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md)
 * — mismo patrón de navegación unificada que Categoría/Marca/Producto/
 * Proveedor: un solo destino para ver/editar/deshabilitar una unidad de
 * medida, con una pestaña de solo lectura mostrando los productos que la
 * usan (la edición de esos productos vive en su propia ficha, no se
 * duplica aquí).
 */
export function UnidadMedidaDetailScreen({ unidadMedidaId }: { unidadMedidaId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [unidad, setUnidad] = useState<UnidadMedida | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(searchParams.get("editar") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateUnidadMedidaPayload>({});
  const [confirmandoCambioEstado, setConfirmandoCambioEstado] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(unidadMedidaId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    Promise.all([getUnidadMedida(unidadMedidaId), listProductosDeUnidadMedida(unidadMedidaId)])
      .then(([unidadResult, productosResult]) => {
        setUnidad(unidadResult);
        setProductos(productosResult);
        setForm({
          nombre: unidadResult.nombre,
          abreviatura: unidadResult.abreviatura ?? "",
        });
      })
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar la unidad de medida.");
        }
      })
      .finally(() => setLoading(false));
  }, [unidadMedidaId]);

  async function save() {
    if (!unidad) return;
    setSaving(true);
    try {
      const actualizada = await updateUnidadMedida(unidad.id, form);
      setUnidad(actualizada);
      setEditing(false);
      toast.success("Unidad de medida actualizada correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstado() {
    if (!unidad) return;
    try {
      const actualizada =
        unidad.estado === "activo"
          ? await disableUnidadMedida(unidad.id)
          : await enableUnidadMedida(unidad.id);
      setUnidad(actualizada);
      toast.success(
        actualizada.estado === "activo" ? "Unidad de medida habilitada" : "Unidad de medida deshabilitada"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando unidad de medida...
      </div>
    );
  }

  if (notFound || !unidad) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-2"
          onClick={() => router.push("/unidades-medida")}
        >
          <ArrowLeft className="size-4" />
          Volver a Unidades de Medida
        </Button>
        <EmptyState
          icon={Ruler}
          title="No encontramos esta unidad de medida"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-2"
          onClick={() => router.push("/unidades-medida")}
        >
          <ArrowLeft className="size-4" />
          Volver a Unidades de Medida
        </Button>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setConfirmandoCambioEstado(true)}
            >
              {unidad.estado === "activo" ? (
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
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Ruler className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{unidad.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              className={
                unidad.estado === "activo"
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-red-600 text-white dark:bg-red-500"
              }
            >
              {unidad.estado === "activo" ? "Activa" : "Inactiva"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="detalle">
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="productos">Productos ({productos.length})</TabsTrigger>
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
                  <Field label="Abreviatura">
                    <Input
                      value={form.abreviatura ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, abreviatura: e.target.value }))}
                    />
                  </Field>
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
                  <InfoRow label="Abreviatura" value={unidad.abreviatura ?? "—"} />
                  <InfoRow label="Productos asociados" value={formatNumber(productos.length)} emphasize />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productos">
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
                          <Link
                            href={`/productos/${producto.id}`}
                            className="text-sm font-medium hover:underline"
                          >
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
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmandoCambioEstado}
        onOpenChange={setConfirmandoCambioEstado}
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
