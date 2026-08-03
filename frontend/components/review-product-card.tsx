"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Package, Pencil, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { colorFromString } from "@/lib/color-from-string";
import { correctDetail } from "@/lib/api/captura-ia";
import type { DetectedProduct } from "@/lib/api/types";

const ESTADO_LABEL: Record<DetectedProduct["estado"], { label: string; className: string }> = {
  aplicado: { label: "Aplicado", className: "bg-success/15 text-success" },
  pendiente_revision: { label: "Pendiente", className: "bg-warning/20 text-amber-700 dark:text-amber-400" },
  corregido: { label: "Corregido", className: "bg-accent text-accent-foreground" },
  descartado: { label: "Descartado", className: "bg-muted text-muted-foreground" },
};

export function ReviewProductCard({
  captureId,
  product,
  onSaved,
}: {
  captureId: string;
  product: DetectedProduct;
  onSaved: (updated: DetectedProduct) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre_detectado: product.name,
    marca_detectado: product.brand ?? "",
    categoria_detectado: product.category ?? "",
    presentacion_detectado: product.presentation ?? "",
    cantidad_detectada: product.quantity,
  });

  const editable = product.estado === "pendiente_revision" || product.estado === "corregido";
  const estadoInfo = ESTADO_LABEL[product.estado];

  async function save() {
    setSaving(true);
    try {
      const updated = await correctDetail(captureId, product.id, form);
      onSaved(updated);
      setEditing(false);
      toast.success("Producto corregido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar el cambio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: colorFromString(product.name) }}
          >
            <Package className="size-6" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              {/* BUG-001: una vez aplicado, este producto ya existe de verdad
                  (product.producto_id) — el nombre navega a su ficha, misma
                  ruta que cualquier otro listado (docs/03_FUNCTIONAL_SPEC/Products.md,
                  adenda "Ficha de Producto"). Antes de aplicarse no hay
                  producto_id todavía, así que no hay destino real al que enlazar. */}
              {product.estado === "aplicado" && product.producto_id ? (
                <Link
                  href={`/productos?ver=${product.producto_id}`}
                  className="truncate font-medium leading-tight hover:underline"
                  title={product.name}
                >
                  {product.name}
                </Link>
              ) : (
                <h3 className="truncate font-medium leading-tight" title={product.name}>{product.name}</h3>
              )}
              {editable && !editing && (
                <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Editar">
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={estadoInfo.className}>
                {estadoInfo.label}
              </Badge>
              <ConfidenceBadge value={product.confidence} />
              {product.es_producto_nuevo && (
                <Badge variant="outline" className="bg-accent text-accent-foreground">
                  Producto nuevo
                </Badge>
              )}
            </div>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <Field label="Nombre">
              <Input
                value={form.nombre_detectado}
                onChange={(e) => setForm((f) => ({ ...f, nombre_detectado: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca">
                <Input
                  value={form.marca_detectado}
                  onChange={(e) => setForm((f) => ({ ...f, marca_detectado: e.target.value }))}
                />
              </Field>
              <Field label="Categoría">
                <Input
                  value={form.categoria_detectado}
                  onChange={(e) => setForm((f) => ({ ...f, categoria_detectado: e.target.value }))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Presentación">
                <Input
                  value={form.presentacion_detectado}
                  onChange={(e) => setForm((f) => ({ ...f, presentacion_detectado: e.target.value }))}
                />
              </Field>
              <Field label="Cantidad">
                <Input
                  type="number"
                  min={0}
                  value={form.cantidad_detectada}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cantidad_detectada: Number(e.target.value) }))
                  }
                />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setEditing(false)}>
                <X className="size-4" />
                Cancelar
              </Button>
              <Button className="flex-1 gap-2" onClick={save} disabled={saving}>
                <Save className="size-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <InfoRow label="Marca" value={product.brand ?? "—"} />
            <InfoRow label="Categoría" value={product.category ?? "—"} />
            <InfoRow label="Presentación" value={product.presentation ?? "—"} />
            <InfoRow
              label="Cantidad"
              value={`${product.quantity} ${product.unit ?? ""}`.trim()}
              emphasize
            />
          </dl>
        )}
      </CardContent>
    </Card>
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
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={emphasize ? "font-semibold tabular-nums" : "text-foreground"}>{value}</dd>
    </div>
  );
}
