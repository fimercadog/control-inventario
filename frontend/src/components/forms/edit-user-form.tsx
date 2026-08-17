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
import { actualizarUsuario } from "@/lib/api/users";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Usuario } from "@/types/user";

const THEME_LABELS: Record<string, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" };
const LANGUAGE_LABELS: Record<string, string> = { es: "Español", en: "English" };

const editUserSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["es", "en"]),
  timezone: z.string().min(1, "La zona horaria es obligatoria."),
});

type EditUserValues = z.infer<typeof editUserSchema>;

export function EditUserForm({
  usuario,
  onSuccess,
}: {
  usuario: Usuario;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      theme: (usuario.theme as EditUserValues["theme"]) ?? "system",
      language: (usuario.language as EditUserValues["language"]) ?? "es",
      timezone: usuario.timezone,
    },
  });

  async function onSubmit(values: EditUserValues) {
    setStatus("submitting");
    setError(null);
    try {
      await actualizarUsuario(usuario.id, values);
      onSuccess();
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo actualizar el usuario."));
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-sm font-medium text-foreground">{usuario.name}</p>
        <p className="text-xs text-muted-foreground">{usuario.email}</p>
      </div>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-theme">Tema</Label>
        <Controller
          name="theme"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
              <SelectTrigger id="edit-theme" className="w-full">
                <SelectValue>{(value: string) => THEME_LABELS[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-language">Idioma</Label>
        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
              <SelectTrigger id="edit-language" className="w-full">
                <SelectValue>{(value: string) => LANGUAGE_LABELS[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-timezone">Zona horaria</Label>
        <Input
          id="edit-timezone"
          placeholder="America/Mexico_City"
          aria-invalid={Boolean(errors.timezone)}
          aria-describedby={errors.timezone ? "edit-timezone-error" : undefined}
          {...register("timezone")}
        />
        {errors.timezone ? (
          <p id="edit-timezone-error" className="text-sm text-destructive">
            {errors.timezone.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar cambios
      </Button>
    </form>
  );
}
