"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registrarIngreso } from "@/lib/api/productos";
import { fetchProveedores } from "@/lib/api/proveedores";
import { findLabel } from "@/lib/utils/select-label";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Producto } from "@/types/producto";
import type { Proveedor } from "@/types/proveedor";

const NUEVO = "__nuevo__";

const ingresoFormSchema = z.object({
  cantidad: z.string().min(1, "La cantidad es obligatoria."),
  costo: z.string(),
  proveedor_id: z.string(),
  proveedor_nuevo: z.string(),
  documento: z.string(),
  observacion: z.string(),
  lote: z.string(),
  vencimiento: z.string(),
});

type IngresoFormValues = z.infer<typeof ingresoFormSchema>;

/**
 * "Registrar ingreso" desde la Ficha de Producto (StoreIngresoRequest). proveedor_id/
 * proveedor_nuevo son mutuamente excluyentes (mismo patrón quick-create que marca/unidad de
 * medida en ProductoForm). Si no se elige proveedor, ProveedorResolver usa el principal
 * asociado al producto si existe (comportamiento real del backend, no del frontend).
 */
export function RegistrarIngresoForm({
  producto,
  onSuccess,
}: {
  producto: Producto;
  onSuccess: (producto: Producto) => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  useEffect(() => {
    fetchProveedores({ estado: "activo", per_page: 100 }).then((d) => setProveedores(d.items)).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<IngresoFormValues>({
    resolver: zodResolver(ingresoFormSchema),
    defaultValues: {
      cantidad: "",
      costo: "",
      proveedor_id: "",
      proveedor_nuevo: "",
      documento: "",
      observacion: "",
      lote: "",
      vencimiento: "",
    },
  });

  const proveedorId = watch("proveedor_id");

  async function onSubmit(values: IngresoFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const updated = await registrarIngreso(producto.id, {
        cantidad: Number(values.cantidad),
        costo: values.costo ? Number(values.costo) : undefined,
        proveedor_id: values.proveedor_id && values.proveedor_id !== NUEVO ? Number(values.proveedor_id) : undefined,
        proveedor_nuevo: values.proveedor_id === NUEVO && values.proveedor_nuevo ? values.proveedor_nuevo : undefined,
        documento: values.documento || null,
        observacion: values.observacion || null,
        lote: values.lote || null,
        vencimiento: values.vencimiento || null,
      });
      onSuccess(updated);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo registrar el ingreso."));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full min-w-0 flex-col gap-4">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex min-w-0 flex-col gap-3 border-b border-border/70 pb-4">
        <div><h2 className="font-heading text-sm font-semibold text-foreground">Detalle del ingreso</h2><p className="mt-1 text-xs text-muted-foreground">La cantidad se sumará al stock actual.</p></div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="ingreso-cantidad">Cantidad</Label>
          <Input
            id="ingreso-cantidad"
            type="number"
            step="0.01"
            min="0.01"
            aria-invalid={Boolean(errors.cantidad)}
            {...register("cantidad")}
          />
          {errors.cantidad ? <p className="text-sm text-destructive">{errors.cantidad.message}</p> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="ingreso-costo">Costo unitario</Label>
          <Input id="ingreso-costo" type="number" step="0.01" min="0" placeholder="Opcional" {...register("costo")} />
        </div>
      </div>
      </section>

      <section className="flex min-w-0 flex-col gap-3 border-b border-border/70 pb-4">
        <div><h2 className="font-heading text-sm font-semibold text-foreground">Origen y trazabilidad</h2><p className="mt-1 text-xs text-muted-foreground">Proveedor, factura, lote y vencimiento son opcionales.</p></div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ingreso-proveedor">Proveedor</Label>
        <Controller
          control={control}
          name="proveedor_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="ingreso-proveedor" className="w-full min-w-0">
                <SelectValue className="min-w-0" placeholder="Usar el proveedor principal del producto (si existe)">
                  {(value: string) =>
                    value === NUEVO
                      ? "+ Crear proveedor nuevo…"
                      : findLabel(
                          value,
                          proveedores,
                          (p) => p.id,
                          (p) => p.nombre,
                          "Usar el proveedor principal del producto (si existe)"
                        )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
                <SelectItem value={NUEVO}>+ Crear proveedor nuevo…</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {proveedorId === NUEVO ? (
          <Input placeholder="Nombre del nuevo proveedor" {...register("proveedor_nuevo")} />
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ingreso-documento">Documento / factura</Label>
        <Input id="ingreso-documento" placeholder="Opcional" {...register("documento")} />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="ingreso-lote">Lote</Label>
          <Input id="ingreso-lote" placeholder="Opcional" {...register("lote")} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="ingreso-vencimiento">Vencimiento</Label>
          <Input id="ingreso-vencimiento" type="date" {...register("vencimiento")} />
        </div>
      </div>
      </section>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ingreso-observacion">Observación</Label>
        <Input id="ingreso-observacion" placeholder="Opcional" {...register("observacion")} />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Registrar ingreso
      </Button>
    </form>
  );
}
