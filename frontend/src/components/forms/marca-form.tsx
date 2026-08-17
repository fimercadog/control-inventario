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
import { crearMarca, actualizarMarca } from "@/lib/api/marcas";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Marca } from "@/types/marca";

const marcaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MarcaFormValues>({
    resolver: zodResolver(marcaFormSchema),
    defaultValues: { nombre: marca?.nombre ?? "" },
  });

  async function onSubmit(values: MarcaFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const payload = { nombre: values.nombre };
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

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {marca ? "Guardar cambios" : "Crear marca"}
      </Button>
    </form>
  );
}
