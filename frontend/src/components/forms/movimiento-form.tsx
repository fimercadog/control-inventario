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
import { crearMovimiento } from "@/lib/api/movimientos";
import { fetchProductos } from "@/lib/api/productos";
import { fetchProveedores } from "@/lib/api/proveedores";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Movimiento } from "@/types/movimiento";
import type { Producto } from "@/types/producto";
import type { Proveedor } from "@/types/proveedor";

const movimientoFormSchema = z.object({
  producto_id: z.string().min(1, "Selecciona un producto."),
  tipo: z.enum(["entrada", "salida", "ajuste"]),
  cantidad: z.string().min(1, "La cantidad es obligatoria."),
  direccion: z.enum(["incremento", "decremento"]),
  costo: z.string(),
  precio: z.string(),
  proveedor_id: z.string(),
  documento: z.string(),
  observacion: z.string(),
  lote: z.string(),
  vencimiento: z.string(),
});

type MovimientoFormValues = z.infer<typeof movimientoFormSchema>;

const TIPO_LABEL: Record<string, string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" };

/**
 * Registrar un movimiento desde el módulo global (StoreMovimientoRequest). `direccion` solo
 * aplica a Ajuste (required_if/prohibited_unless en el Request real — Entrada/Salida nunca la
 * envían); `proveedor_id` solo aplica a Entrada (prohibited_unless:tipo,entrada en el Request
 * real). El selector de tipo cambia qué campos se muestran, reflejando exactamente esas
 * restricciones del backend en vez de mostrar siempre todos los campos.
 */
export function MovimientoForm({ onSuccess }: { onSuccess: (movimiento: Movimiento) => void }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  useEffect(() => {
    fetchProductos({ estado: "activo", per_page: 100 }).then((d) => setProductos(d.items)).catch(() => {});
    fetchProveedores({ estado: "activo", per_page: 100 }).then((d) => setProveedores(d.items)).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoFormSchema),
    defaultValues: {
      producto_id: "",
      tipo: "entrada",
      cantidad: "",
      direccion: "incremento",
      costo: "",
      precio: "",
      proveedor_id: "",
      documento: "",
      observacion: "",
      lote: "",
      vencimiento: "",
    },
  });

  const tipo = watch("tipo");

  async function onSubmit(values: MovimientoFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const movimiento = await crearMovimiento({
        producto_id: Number(values.producto_id),
        tipo: values.tipo,
        cantidad: Number(values.cantidad),
        direccion: values.tipo === "ajuste" ? values.direccion : undefined,
        costo: values.costo ? Number(values.costo) : undefined,
        precio: values.precio ? Number(values.precio) : undefined,
        proveedor_id: values.tipo === "entrada" && values.proveedor_id ? Number(values.proveedor_id) : undefined,
        documento: values.documento || null,
        observacion: values.observacion || null,
        lote: values.lote || null,
        vencimiento: values.vencimiento || null,
      });
      onSuccess(movimiento);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo registrar el movimiento."));
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
        <Label htmlFor="movimiento-tipo">Tipo</Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "entrada")}>
              <SelectTrigger id="movimiento-tipo">
                <SelectValue>{(value: string) => TIPO_LABEL[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="movimiento-producto">Producto</Label>
        <Controller
          control={control}
          name="producto_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="movimiento-producto" aria-invalid={Boolean(errors.producto_id)}>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.producto_id ? <p className="text-sm text-destructive">{errors.producto_id.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="movimiento-cantidad">Cantidad</Label>
          <Input
            id="movimiento-cantidad"
            type="number"
            step="0.01"
            min="0.01"
            aria-invalid={Boolean(errors.cantidad)}
            {...register("cantidad")}
          />
          {errors.cantidad ? <p className="text-sm text-destructive">{errors.cantidad.message}</p> : null}
        </div>
        {tipo === "ajuste" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="movimiento-direccion">Dirección del ajuste</Label>
            <Controller
              control={control}
              name="direccion"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "incremento")}>
                  <SelectTrigger id="movimiento-direccion">
                    <SelectValue>{(value: string) => (value === "incremento" ? "Incremento (+)" : "Decremento (-)")}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incremento">Incremento (+)</SelectItem>
                    <SelectItem value="decremento">Decremento (-)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : null}
      </div>

      {tipo === "entrada" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="movimiento-proveedor">Proveedor (opcional)</Label>
            <Controller
              control={control}
              name="proveedor_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="movimiento-proveedor">
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movimiento-costo">Costo</Label>
            <Input id="movimiento-costo" type="number" step="0.01" min="0" placeholder="Opcional" {...register("costo")} />
          </div>
        </div>
      ) : null}

      {tipo === "salida" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="movimiento-precio">Precio</Label>
          <Input id="movimiento-precio" type="number" step="0.01" min="0" placeholder="Opcional" {...register("precio")} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="movimiento-documento">Documento</Label>
        <Input id="movimiento-documento" placeholder="Opcional" {...register("documento")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="movimiento-lote">Lote</Label>
          <Input id="movimiento-lote" placeholder="Opcional" {...register("lote")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="movimiento-vencimiento">Vencimiento</Label>
          <Input id="movimiento-vencimiento" type="date" {...register("vencimiento")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="movimiento-observacion">Observación</Label>
        <Input id="movimiento-observacion" placeholder="Opcional" {...register("observacion")} />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Registrar movimiento
      </Button>
    </form>
  );
}
