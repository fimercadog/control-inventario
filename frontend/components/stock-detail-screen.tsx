"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, ExternalLink, Loader2, Pencil, Save, Warehouse, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getStock, updateStock, disableStock, enableStock } from "@/lib/api/stock";
import type { Stock, UpdateStockPayload } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

/**
 * Ficha de Stock (RC1 Fase 2, docs/03_FUNCTIONAL_SPEC/Stock.md). Stock NO
 * es una entidad independiente: esta ficha nunca permite tocar
 * `stock_actual` (siempre de solo lectura aquí — la única forma real de
 * cambiar la cantidad es Entrada/Salida/Ajuste vía Movimientos, enlazado
 * desde la ficha de Producto) ni el `estado` de catálogo del producto.
 * Solo los umbrales (`stock_minimo`/`stock_maximo`) son editables, y
 * "Eliminar" es puramente administrativo (oculta del listado de Stock,
 * nunca modifica cantidades).
 */
export function StockDetailScreen({ productoId }: { productoId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(searchParams.get("editar") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateStockPayload>({});
  const [confirmandoCambioEstado, setConfirmandoCambioEstado] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(productoId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    getStock(productoId)
      .then((result) => {
        setStock(result);
        setForm({
          stock_minimo: result.stock_minimo,
          stock_maximo: result.stock_maximo,
        });
      })
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el stock.");
        }
      })
      .finally(() => setLoading(false));
  }, [productoId]);

  async function save() {
    if (!stock) return;
    setSaving(true);
    try {
      const actualizado = await updateStock(stock.id, form);
      setStock(actualizado);
      setEditing(false);
      toast.success("Stock actualizado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstado() {
    if (!stock) return;
    try {
      const actualizado = stock.estado === "activo" ? await disableStock(stock.id) : await enableStock(stock.id);
      setStock(actualizado);
      toast.success(actualizado.estado === "activo" ? "Stock habilitado" : "Stock deshabilitado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando stock...
      </div>
    );
  }

  if (notFound || !stock) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/stock")}>
          <ArrowLeft className="size-4" />
          Volver a Stock
        </Button>
        <EmptyState
          icon={Warehouse}
          title="No encontramos este registro de Stock"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/stock")}>
          <ArrowLeft className="size-4" />
          Volver a Stock
        </Button>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setConfirmandoCambioEstado(true)}
            >
              {stock.estado === "activo" ? (
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
              Editar umbrales
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Warehouse className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{stock.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{stock.codigo ?? "—"}</span>
            {stock.categoria && <span>· {stock.categoria}</span>}
            {stock.marca && <span>· {stock.marca}</span>}
            <Badge
              className={
                stock.estado === "activo"
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-red-600 text-white dark:bg-red-500"
              }
            >
              {stock.estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid grid-cols-3 gap-4">
            <InfoRow
              label="Stock actual (solo lectura)"
              value={`${formatNumber(stock.stock_actual)}${stock.unidad_medida ? ` ${stock.unidad_medida}` : ""}`}
              emphasize
              warn={stock.bajo_minimo}
            />
            {editing ? (
              <>
                <Field label="Stock mínimo">
                  <Input
                    type="number"
                    min={0}
                    value={form.stock_minimo ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, stock_minimo: Number(e.target.value) }))}
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
              </>
            ) : (
              <>
                <InfoRow label="Stock mínimo" value={formatNumber(stock.stock_minimo)} />
                <InfoRow
                  label="Stock máximo"
                  value={stock.stock_maximo !== null ? formatNumber(stock.stock_maximo) : "—"}
                />
              </>
            )}
          </div>

          {stock.bajo_minimo && !editing && (
            <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="size-4 shrink-0" />
              El stock actual está por debajo del mínimo configurado.
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            El stock actual solo cambia mediante Entrada, Salida o Ajuste de inventario. Este formulario nunca
            modifica esa cantidad — solo los umbrales de alerta.
          </p>

          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setEditing(false)} disabled={saving}>
                <X className="size-4" />
                Cancelar
              </Button>
              <Button className="flex-1 gap-2" onClick={save} disabled={saving}>
                <Save className="size-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          ) : (
            <Link href={`/productos?ver=${stock.id}`} className="w-fit">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="size-4" />
                Ver ficha de producto y movimientos
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmandoCambioEstado}
        onOpenChange={setConfirmandoCambioEstado}
        title={stock.estado === "activo" ? "¿Eliminar este registro de Stock?" : "¿Habilitar este registro de Stock?"}
        description={
          stock.estado === "activo"
            ? `"${stock.nombre}" se ocultará del módulo Stock. Esto es puramente administrativo: no modifica la cantidad actual, no crea ningún movimiento, y el producto sigue siendo válido en Productos, Proveedores y Movimientos.`
            : `"${stock.nombre}" volverá a aparecer en el listado de Stock.`
        }
        confirmLabel={stock.estado === "activo" ? "Eliminar" : "Habilitar"}
        destructive={stock.estado === "activo"}
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

function InfoRow({
  label,
  value,
  emphasize,
  warn,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`${emphasize ? "font-medium" : ""} ${warn ? "text-amber-600 dark:text-amber-400" : ""}`.trim()}
      >
        {value}
      </span>
    </div>
  );
}
