"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { crearCategoria, actualizarCategoria } from "@/lib/api/categorias";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Categoria } from "@/types/categoria";

const categoriaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  descripcion: z.string(),
});

type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;

/**
 * Shared by Nueva Categoría and Editar Categoría: StoreCategoriaRequest/UpdateCategoriaRequest
 * accept the same two real fields (nombre, descripcion). `estado` is deliberately not a form
 * field — UpdateCategoriaRequest excludes it entirely (a real 2026-08-10 RBAC fix: allowing it
 * here would let the laxer categorias.editar permission bypass the stricter categorias.gestionar
 * check the dedicated /deshabilitar endpoint requires) — Habilitar/Deshabilitar are the real
 * actions for that, same as Roles keeps status changes out of its edit form.
 */
export function CategoriaForm({
  categoria,
  onSuccess,
}: {
  categoria?: Categoria;
  onSuccess: (categoria: Categoria) => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: { nombre: categoria?.nombre ?? "", descripcion: categoria?.descripcion ?? "" },
  });

  async function onSubmit(values: CategoriaFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const payload = { nombre: values.nombre, descripcion: values.descripcion || null };
      const saved = categoria
        ? await actualizarCategoria(categoria.id, payload)
        : await crearCategoria(payload);
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar la categoría."));
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
        <Label htmlFor="categoria-nombre">Nombre</Label>
        <Input
          id="categoria-nombre"
          placeholder="Ej. Alimentos"
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? "categoria-nombre-error" : undefined}
          {...register("nombre")}
        />
        {errors.nombre ? (
          <p id="categoria-nombre-error" className="text-sm text-destructive">
            {errors.nombre.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="categoria-descripcion">Descripción</Label>
        <Textarea
          id="categoria-descripcion"
          placeholder="Descripción opcional"
          {...register("descripcion")}
        />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {categoria ? "Guardar cambios" : "Crear categoría"}
      </Button>
    </form>
  );
}
