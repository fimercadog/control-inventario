"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { asociarProveedor } from "@/lib/api/producto-proveedor";
import { fetchProveedores } from "@/lib/api/proveedores";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { findLabel } from "@/lib/utils/select-label";
import type { ProductoProveedorAsociacion } from "@/types/producto-proveedor";
import type { Proveedor } from "@/types/proveedor";

const asociacionFormSchema = z.object({
  proveedor_id: z.string().min(1, "Selecciona un proveedor."),
  es_principal: z.boolean(),
  precio_compra: z.string(),
  codigo_proveedor: z.string(),
});

type AsociacionFormValues = z.infer<typeof asociacionFormSchema>;

/**
 * Asocia un Proveedor existente a este Producto (StoreProductoProveedorRequest).
 * `proveedor_id` es obligatorio y no editable después de creada la asociación — el único
 * campo real de esta pantalla es "elegir cuál proveedor", no "crear uno nuevo aquí" (a
 * diferencia de Registrar Ingreso, este endpoint no acepta proveedor_nuevo).
 */
export function ProductoProveedorForm({
  productoId,
  yaAsociados,
  onSuccess,
}: {
  productoId: number;
  yaAsociados: number[];
  onSuccess: (asociacion: ProductoProveedorAsociacion) => void;
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
    formState: { errors },
  } = useForm<AsociacionFormValues>({
    resolver: zodResolver(asociacionFormSchema),
    defaultValues: { proveedor_id: "", es_principal: false, precio_compra: "", codigo_proveedor: "" },
  });

  const disponibles = proveedores.filter((p) => !yaAsociados.includes(p.id));

  async function onSubmit(values: AsociacionFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const asociacion = await asociarProveedor(productoId, {
        proveedor_id: Number(values.proveedor_id),
        es_principal: values.es_principal,
        precio_compra: values.precio_compra ? Number(values.precio_compra) : null,
        codigo_proveedor: values.codigo_proveedor || null,
      });
      onSuccess(asociacion);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo asociar el proveedor."));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="asociacion-proveedor">Proveedor</Label>
        <Controller
          control={control}
          name="proveedor_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="asociacion-proveedor" aria-invalid={Boolean(errors.proveedor_id)}>
                <SelectValue placeholder="Selecciona un proveedor">
                  {(value: string) => findLabel(value, disponibles, (p) => p.id, (p) => p.nombre, "Selecciona un proveedor")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {disponibles.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.proveedor_id ? <p className="text-sm text-destructive">{errors.proveedor_id.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="asociacion-precio">Precio de compra</Label>
          <Input
            id="asociacion-precio"
            type="number"
            step="0.01"
            min="0"
            placeholder="Opcional"
            {...register("precio_compra")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="asociacion-codigo">Código del proveedor</Label>
          <Input id="asociacion-codigo" placeholder="Opcional" {...register("codigo_proveedor")} />
        </div>
      </div>

      <Controller
        control={control}
        name="es_principal"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
            Marcar como proveedor principal
          </label>
        )}
      />

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Asociar proveedor
      </Button>
    </form>
  );
}
