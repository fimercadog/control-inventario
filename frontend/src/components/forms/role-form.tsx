"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionsSelector } from "@/components/forms/permissions-selector";
import { crearRol, actualizarRol } from "@/lib/api/roles";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Role } from "@/types/role";

const roleFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  permisos: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

/**
 * Shared by Nuevo Rol and Editar Rol: StoreRoleRequest/UpdateRoleRequest accept the same
 * two fields (name, permisos). `estado` is deliberately not a form field — the backend
 * also allows setting it here, but Activar/Desactivar are the real dedicated actions for
 * that, same as Usuarios keeps status changes out of its edit form.
 */
export function RoleForm({
  role,
  allPermissions,
  onSuccess,
}: {
  role?: Role;
  allPermissions: string[];
  onSuccess: (role: Role) => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: role?.name ?? "", permisos: role?.permisos ?? [] },
  });

  async function onSubmit(values: RoleFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const saved = role
        ? await actualizarRol(role.id, values)
        : await crearRol(values);
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar el rol."));
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
        <Label htmlFor="role-name">Nombre</Label>
        <Input
          id="role-name"
          placeholder="Ej. Supervisor de bodega"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "role-name-error" : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id="role-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Permisos</Label>
        <Controller
          name="permisos"
          control={control}
          render={({ field }) => (
            <PermissionsSelector
              allPermissions={allPermissions}
              selected={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {role ? "Guardar cambios" : "Crear rol"}
      </Button>
    </form>
  );
}
