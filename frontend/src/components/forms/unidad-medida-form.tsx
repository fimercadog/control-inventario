"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { crearUnidadMedida, actualizarUnidadMedida } from "@/lib/api/unidades-medida";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { UnidadMedida } from "@/types/unidad-medida";

const unidadMedidaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  abreviatura: z.string(),
});

type UnidadMedidaFormValues = z.infer<typeof unidadMedidaFormSchema>;

/**
 * Shared by Nueva Unidad de Medida y Editar: StoreUnidadMedidaRequest/UpdateUnidadMedidaRequest
 * accept nombre (required) y abreviatura (opcional). `estado` deliberadamente no es un campo
 * del formulario — UpdateUnidadMedidaRequest lo excluye (2026-08-10 RBAC fix, mismo patrón que
 * Categorías/Marcas): Habilitar/Deshabilitar son las acciones reales para eso.
 */
export function UnidadMedidaForm({
  unidadMedida,
  onSuccess,
}: {
  unidadMedida?: UnidadMedida;
  onSuccess: (unidadMedida: UnidadMedida) => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnidadMedidaFormValues>({
    resolver: zodResolver(unidadMedidaFormSchema),
    defaultValues: { nombre: unidadMedida?.nombre ?? "", abreviatura: unidadMedida?.abreviatura ?? "" },
  });

  async function onSubmit(values: UnidadMedidaFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const payload = { nombre: values.nombre, abreviatura: values.abreviatura || null };
      const saved = unidadMedida
        ? await actualizarUnidadMedida(unidadMedida.id, payload)
        : await crearUnidadMedida(payload);
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar la unidad de medida."));
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
        <Label htmlFor="unidad-nombre">Nombre</Label>
        <Input
          id="unidad-nombre"
          placeholder="Ej. Kilogramo"
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? "unidad-nombre-error" : undefined}
          {...register("nombre")}
        />
        {errors.nombre ? (
          <p id="unidad-nombre-error" className="text-sm text-destructive">
            {errors.nombre.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="unidad-abreviatura">Abreviatura</Label>
        <Input id="unidad-abreviatura" placeholder="Ej. kg (opcional)" {...register("abreviatura")} />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {unidadMedida ? "Guardar cambios" : "Crear unidad de medida"}
      </Button>
    </form>
  );
}
