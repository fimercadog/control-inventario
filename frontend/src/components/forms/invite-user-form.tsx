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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invitarUsuario } from "@/lib/api/users";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Role } from "@/types/role";

const inviteUserSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  email: z.string().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
  role_id: z.string(),
});

type InviteUserValues = z.infer<typeof inviteUserSchema>;

export function InviteUserForm({ roles }: { roles: Role[] }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InviteUserValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { name: "", email: "", role_id: "" },
  });

  async function onSubmit(values: InviteUserValues) {
    setStatus("submitting");
    setError(null);
    try {
      await invitarUsuario({
        name: values.name,
        email: values.email,
        role_id: values.role_id ? Number(values.role_id) : undefined,
      });
      setStatus("success");
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo enviar la invitación."));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Alert role="status">
        <AlertDescription>Invitación enviada correctamente.</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-name">Nombre completo</Label>
        <Input
          id="invite-name"
          autoComplete="name"
          placeholder="Nombre y apellido"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "invite-name-error" : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id="invite-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-email">Correo electrónico</Label>
        <Input
          id="invite-email"
          type="email"
          autoComplete="email"
          placeholder="nuevo.usuario@empresa.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "invite-email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="invite-email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {roles.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-role">Rol (opcional)</Label>
          <Controller
            name="role_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={(value) => field.onChange(value ?? "")}>
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue placeholder="Sin rol asignado" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      ) : null}

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Enviar invitación
      </Button>
    </form>
  );
}
