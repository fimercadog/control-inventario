"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { crearMarca, actualizarMarca } from "@/lib/api/marcas";
import { fetchProveedores } from "@/lib/api/proveedores";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Marca } from "@/types/marca";
import type { Proveedor } from "@/types/proveedor";

const marcaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  proveedor_ids: z.array(z.string()),
});

type MarcaFormValues = z.infer<typeof marcaFormSchema>;

/**
 * Shared by Nueva Marca and Editar Marca: StoreMarcaRequest/UpdateMarcaRequest accept only
 * `nombre` (no descripcion field exists on marcas, unlike Categorías). `estado` is
 * deliberately not a form field — UpdateMarcaRequest excludes it (2026-08-10 RBAC fix):
 * Habilitar/Deshabilitar are the real actions for that.
 */
export function MarcaForm({ marca, onSuccess }: { marca?: Marca; onSuccess: (marca: Marca) => void }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  useEffect(() => {
    fetchProveedores({ estado: "activo", per_page: 100 }).then((data) => setProveedores(data.items)).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MarcaFormValues>({
    resolver: zodResolver(marcaFormSchema),
    defaultValues: {
      nombre: marca?.nombre ?? "",
      proveedor_ids: marca?.proveedores?.map((proveedor) => String(proveedor.id)) ?? [],
    },
  });

  async function onSubmit(values: MarcaFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const payload = { nombre: values.nombre, proveedor_ids: values.proveedor_ids.map(Number) };
      const saved = marca ? await actualizarMarca(marca.id, payload) : await crearMarca(payload);
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar la marca."));
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
        <Label htmlFor="marca-nombre">Nombre</Label>
        <Input
          id="marca-nombre"
          placeholder="Ej. Purina"
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? "marca-nombre-error" : undefined}
          {...register("nombre")}
        />
        {errors.nombre ? (
          <p id="marca-nombre-error" className="text-sm text-destructive">
            {errors.nombre.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-border/70 pt-4">
        <div>
          <Label>Proveedores de la marca</Label>
          <p className="mt-1 text-xs text-muted-foreground">Selecciona los proveedores que comercializan esta marca.</p>
        </div>
        <Controller
          control={control}
          name="proveedor_ids"
          render={({ field }) => (
            <div className="max-h-44 overflow-y-auto rounded-lg border border-input p-2">
              {proveedores.length === 0 ? (
                <p className="px-2 py-1 text-sm text-muted-foreground">No hay proveedores activos.</p>
              ) : proveedores.map((proveedor) => {
                const checked = field.value.includes(String(proveedor.id));
                return (
                  <label key={proveedor.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) => field.onChange(nextChecked ? [...field.value, String(proveedor.id)] : field.value.filter((id) => id !== String(proveedor.id)))}
                    />
                    <span className="truncate">{proveedor.nombre}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {marca ? "Guardar cambios" : "Crear marca"}
      </Button>
    </form>
  );
}
