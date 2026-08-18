"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearMovimiento } from "@/lib/api/movimientos";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Movimiento } from "@/types/movimiento";
import type { StockItem } from "@/types/stock";

const schema = z.object({
  cantidad: z.string().min(1, "Indica una cantidad."),
  observacion: z.string().trim().min(3, "Indica el motivo del ajuste."),
});

type FormValues = z.infer<typeof schema>;

/**
 * Ajusta el saldo a un conteo físico. El valor nunca se escribe directamente
 * en Producto: se convierte en un Movimiento de tipo ajuste para conservar el
 * kardex y la auditoría completos.
 */
export function AjustarStockForm({ item, onSuccess }: { item: StockItem; onSuccess: (movimiento: Movimiento) => void }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [modo, setModo] = useState<"conteo" | "ingreso">("conteo");
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cantidad: "", observacion: "" },
  });

  const cantidad = Number(watch("cantidad"));
  const diferencia = Number.isFinite(cantidad)
    ? modo === "conteo" ? cantidad - item.stock_actual : cantidad
    : null;

  async function onSubmit(values: FormValues) {
    const valor = Number(values.cantidad);
    const delta = modo === "conteo" ? valor - item.stock_actual : valor;
    if (!Number.isFinite(valor) || valor < 0) {
      setError(modo === "conteo" ? "El stock contado debe ser un número igual o mayor que cero." : "La cantidad a agregar debe ser mayor que cero.");
      return;
    }
    if (delta === 0) {
      setError(modo === "conteo" ? "El stock contado coincide con el stock actual; no hay nada que ajustar." : "La cantidad a agregar debe ser mayor que cero.");
      return;
    }

    setStatus("submitting");
    setError(null);
    try {
      const movimiento = await crearMovimiento({
        producto_id: item.id,
        tipo: "ajuste",
        cantidad: Math.abs(delta),
        direccion: delta > 0 ? "incremento" : "decremento",
        observacion: values.observacion.trim(),
      });
      onSuccess(movimiento);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo ajustar el stock."));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-w-0 flex-col gap-5">
      {error ? <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert> : null}

      <section className="flex flex-col gap-3 border-b border-border/70 pb-4">
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground">Actualizar existencias</h2>
          <p className="mt-1 text-xs text-muted-foreground">Elige si vas a contar todo el stock o a ingresar unidades adicionales.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={modo === "conteo" ? "default" : "outline"} onClick={() => setModo("conteo")}>Establecer stock real</Button>
          <Button type="button" variant={modo === "ingreso" ? "default" : "outline"} onClick={() => setModo("ingreso")}>Agregar stock</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Stock actual</Label>
            <Input value={item.stock_actual} disabled readOnly />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stock-cantidad">{modo === "conteo" ? "Stock contado" : "Cantidad a agregar"}</Label>
            <Input id="stock-cantidad" type="number" step="0.01" min={modo === "conteo" ? "0" : "0.01"} placeholder={modo === "conteo" ? "Ej. 150" : "Ej. 24"} aria-invalid={Boolean(errors.cantidad)} {...register("cantidad")} />
            {errors.cantidad ? <p className="text-xs text-destructive">{errors.cantidad.message}</p> : null}
          </div>
        </div>
        {diferencia !== null ? (
          <p className={diferencia > 0 ? "text-sm text-success" : diferencia < 0 ? "text-sm text-warning" : "text-sm text-muted-foreground"}>
            {diferencia > 0 ? `Se sumarán ${diferencia}; el nuevo stock será ${item.stock_actual + diferencia}.` : diferencia < 0 ? `Se descontarán ${Math.abs(diferencia)}; el nuevo stock será ${item.stock_actual + diferencia}.` : "No habrá cambios."}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ajuste-observacion">Motivo del ajuste</Label>
        <Input id="ajuste-observacion" placeholder="Ej. Conteo físico de cierre" aria-invalid={Boolean(errors.observacion)} {...register("observacion")} />
        <p className="text-xs text-muted-foreground">Obligatorio para conservar la trazabilidad del inventario.</p>
        {errors.observacion ? <p className="text-xs text-destructive">{errors.observacion.message}</p> : null}
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar ajuste
      </Button>
    </form>
  );
}
