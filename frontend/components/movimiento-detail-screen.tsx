"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2, Paperclip, Pencil, RefreshCw, Save, ScrollText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { getMovimiento, updateMovimiento } from "@/lib/api/movimientos";
import type { Movimiento, UpdateMovimientoPayload } from "@/lib/api/types";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
  conteo: "Conteo",
  transferencia: "Transferencia",
};

const TIPO_ICON: Record<string, React.ElementType> = {
  entrada: ArrowDownLeft,
  salida: ArrowUpRight,
  ajuste: RefreshCw,
};

/**
 * Ficha de Movimiento (RC1 Fase 3, docs/03_FUNCTIONAL_SPEC/Movements.md).
 * Un movimiento es el registro contable del inventario: `tipo`,
 * `cantidad`, `producto`, `proveedor`, `stock_anterior`/`stock_nuevo` se
 * muestran siempre de solo lectura, sin excepción. "Editar" solo existe
 * para metadata descriptiva (documento/observación/lote/vencimiento).
 * No existe ningún botón "Eliminar" en esta pantalla — un movimiento
 * nunca se elimina ni se anula (decisión confirmada explícitamente por
 * el propietario del proyecto).
 */
export function MovimientoDetailScreen({ movimientoId }: { movimientoId: number }) {
  const router = useRouter();

  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateMovimientoPayload>({});

  useEffect(() => {
    if (!Number.isFinite(movimientoId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    getMovimiento(movimientoId)
      .then((result) => {
        setMovimiento(result);
        setForm({
          documento: result.documento ?? "",
          observacion: result.observacion ?? "",
          lote: result.lote ?? "",
          vencimiento: result.vencimiento ?? "",
        });
      })
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el movimiento.");
        }
      })
      .finally(() => setLoading(false));
  }, [movimientoId]);

  async function save() {
    if (!movimiento) return;
    setSaving(true);
    try {
      const actualizado = await updateMovimiento(movimiento.id, form);
      setMovimiento(actualizado);
      setEditing(false);
      toast.success("Movimiento actualizado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando movimiento...
      </div>
    );
  }

  if (notFound || !movimiento) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/movimientos")}>
          <ArrowLeft className="size-4" />
          Volver a Movimientos
        </Button>
        <EmptyState
          icon={ScrollText}
          title="No encontramos este movimiento"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  const Icon = TIPO_ICON[movimiento.tipo] ?? ScrollText;
  const esPositivo = movimiento.delta >= 0;
  const unidad = movimiento.unidad_medida ? ` ${movimiento.unidad_medida}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/movimientos")}>
          <ArrowLeft className="size-4" />
          Volver a Movimientos
        </Button>
        {!editing && (
          <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div
          className={`flex size-16 shrink-0 items-center justify-center rounded-xl ${
            esPositivo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          <Icon className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {TIPO_LABEL[movimiento.tipo] ?? movimiento.tipo}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{movimiento.created_at ? formatRelativeTime(movimiento.created_at) : "—"}</Badge>
            {movimiento.usuario && <span>· {movimiento.usuario}</span>}
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Producto (solo lectura)">
              <Link href={`/productos/${movimiento.producto_id}`} className="inline-flex items-center gap-1.5 font-medium hover:underline">
                {movimiento.producto ?? `#${movimiento.producto_id}`}
                <ExternalLink className="size-3.5" />
              </Link>
            </InfoRow>
            <InfoRow label="Cantidad (solo lectura)">
              <span className={`font-medium tabular-nums ${esPositivo ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {esPositivo ? "+" : ""}
                {formatNumber(movimiento.delta)}
                {unidad}
              </span>
            </InfoRow>
            <InfoRow label="Stock anterior → nuevo (solo lectura)">
              <span className="tabular-nums">
                {formatNumber(movimiento.stock_anterior)}
                {unidad} → {formatNumber(movimiento.stock_nuevo)}
                {unidad}
              </span>
            </InfoRow>
            {movimiento.proveedor && <InfoRow label="Proveedor (solo lectura)">{movimiento.proveedor}</InfoRow>}
            <InfoRow label="Origen (solo lectura)">
              {movimiento.origen === "captura_ia" ? (
                <Badge variant="outline" className="gap-1 text-primary">
                  <Sparkles className="size-3" />
                  Captura IA
                </Badge>
              ) : (
                <span>Manual</span>
              )}
            </InfoRow>
            <InfoRow label="Evidencia (solo lectura)">
              {movimiento.tiene_evidencia ? (
                <span className="inline-flex items-center gap-1.5">
                  <Paperclip className="size-3.5" />
                  Disponible
                </span>
              ) : (
                <span className="text-muted-foreground">No disponible</span>
              )}
            </InfoRow>
          </div>

          <p className="text-xs text-muted-foreground">
            Un movimiento es el registro contable del inventario: tipo, cantidad, producto, proveedor y stock nunca
            se editan una vez creados. Para corregir un error, registra un Ajuste compensatorio nuevo.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="text-sm font-semibold">Metadata</h2>
          {editing ? (
            <>
              <Field label="Documento">
                <Input
                  value={form.documento ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
                />
              </Field>
              <Field label="Observación">
                <Input
                  value={form.observacion ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
                />
              </Field>
              <Field label="Lote">
                <Input value={form.lote ?? ""} onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))} />
              </Field>
              <Field label="Vencimiento">
                <Input
                  type="date"
                  value={form.vencimiento ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, vencimiento: e.target.value }))}
                />
              </Field>
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
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Documento">{movimiento.documento ?? "—"}</InfoRow>
              <InfoRow label="Observación">{movimiento.observacion ?? "—"}</InfoRow>
              <InfoRow label="Lote">{movimiento.lote ?? "—"}</InfoRow>
              <InfoRow label="Vencimiento">{movimiento.vencimiento ?? "—"}</InfoRow>
            </div>
          )}
        </CardContent>
      </Card>
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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
