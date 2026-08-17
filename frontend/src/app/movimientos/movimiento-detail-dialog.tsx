"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { actualizarMovimiento } from "@/lib/api/movimientos";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { Movimiento } from "@/types/movimiento";

const TIPO_LABEL: Record<string, string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" };

const metadataSchema = z.object({
  documento: z.string(),
  observacion: z.string(),
  lote: z.string(),
  vencimiento: z.string(),
});

type MetadataValues = z.infer<typeof metadataSchema>;

/**
 * Wrapper de solo montaje/cierre — el contenido real vive en MovimientoDetailForm, montado con
 * `key={movimiento.id}` para que el formulario (y su error local) arranquen limpios en cada
 * movimiento distinto sin necesitar un setState síncrono dentro de un efecto (regla
 * set-state-in-effect del React Compiler).
 */
export function MovimientoDetailDialog({
  movimiento,
  onClose,
  canEditMetadata,
  onUpdated,
}: {
  movimiento: Movimiento | null;
  onClose: () => void;
  canEditMetadata: boolean;
  onUpdated: (movimiento: Movimiento) => void;
}) {
  return (
    <Dialog open={movimiento !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimiento</DialogTitle>
        </DialogHeader>
        {movimiento ? (
          <MovimientoDetailForm
            key={movimiento.id}
            movimiento={movimiento}
            canEditMetadata={canEditMetadata}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Los campos contables (cantidad/tipo/producto/stock antes-después) son de solo lectura para
 * siempre — nunca hay un formulario que los toque, ni deshabilitado ni de otra forma; no
 * existen en UpdateMovimientoRequest en absoluto. Solo la metadata descriptiva es editable.
 * `canEditMetadata` refleja `movimientos.ver` (no existe un permiso `movimientos.editar` en
 * el catálogo real — MovimientoPolicy::update() solo exige pertenencia a la empresa,
 * confirmado contra el Policy real, no asumido).
 */
function MovimientoDetailForm({
  movimiento,
  canEditMetadata,
  onUpdated,
}: {
  movimiento: Movimiento;
  canEditMetadata: boolean;
  onUpdated: (movimiento: Movimiento) => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<MetadataValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      documento: movimiento.documento ?? "",
      observacion: movimiento.observacion ?? "",
      lote: movimiento.lote ?? "",
      vencimiento: movimiento.vencimiento ?? "",
    },
  });

  async function onSubmit(values: MetadataValues) {
    setStatus("submitting");
    setError(null);
    try {
      const updated = await actualizarMovimiento(movimiento.id, {
        documento: values.documento || null,
        observacion: values.observacion || null,
        lote: values.lote || null,
        vencimiento: values.vencimiento || null,
      });
      onUpdated(updated);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo actualizar el movimiento."));
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-xl font-semibold text-foreground">{TIPO_LABEL[movimiento.tipo] ?? movimiento.tipo}</span>
        <Badge
          className={
            movimiento.delta >= 0
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
              : "border-red-500/40 bg-red-500/15 text-red-400"
          }
        >
          {movimiento.delta >= 0 ? "+" : ""}
          {movimiento.delta}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Producto"
          value={`${movimiento.producto ?? "—"}${movimiento.producto_codigo ? ` (${movimiento.producto_codigo})` : ""}`}
        />
        <Field label="Cantidad" value={String(movimiento.cantidad)} />
        <Field label="Stock antes → después" value={`${movimiento.stock_anterior} → ${movimiento.stock_nuevo}`} />
        <Field label="Usuario" value={movimiento.usuario ?? "—"} />
        <Field label="Proveedor" value={movimiento.proveedor ?? "—"} />
        <Field label="Fecha" value={formatDateTime(movimiento.created_at)} />
        <Field label="Origen" value={movimiento.origen === "captura_ia" ? "Captura IA" : "Manual"} />
      </div>
      <p className="text-xs text-muted-foreground">
        Los campos contables (cantidad, tipo, producto, stock) son de solo lectura — un
        movimiento nunca se elimina ni se modifica en su parte contable. Solo la información
        descriptiva de abajo es editable.
      </p>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {canEditMetadata ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mov-documento">Documento</Label>
            <Input id="mov-documento" {...register("documento")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mov-lote">Lote</Label>
              <Input id="mov-lote" {...register("lote")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mov-vencimiento">Vencimiento</Label>
              <Input id="mov-vencimiento" type="date" {...register("vencimiento")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mov-observacion">Observación</Label>
            <Input id="mov-observacion" {...register("observacion")} />
          </div>
          <Button type="submit" disabled={status === "submitting"} className="w-full">
            {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar metadata
          </Button>
        </form>
      ) : null}
    </div>
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
