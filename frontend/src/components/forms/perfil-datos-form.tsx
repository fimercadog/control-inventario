"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actualizarPerfil } from "@/lib/api/perfil";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { AuthenticatedUser } from "@/types/auth";

const datosSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["es", "en"]),
  timezone: z.string().min(1),
});

type DatosValues = z.infer<typeof datosSchema>;

const BASE_TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "UTC",
];

/** The backend accepts any valid PHP timezone (`timezone:all`) — this curated list is just a
 * convenience subset for the dropdown, not a real restriction. Always includes the user's
 * current value even if outside the curated list, so the Select never renders blank/mismatched
 * for an account whose timezone isn't one of these six. */
function timezoneOptions(current: string): string[] {
  return BASE_TIMEZONES.includes(current) ? BASE_TIMEZONES : [current, ...BASE_TIMEZONES];
}

/**
 * Solo theme/language/timezone — name/email son Identity, fijados al aceptar la invitación
 * (ADR-015), nunca editables aquí (UpdateProfileRequest los excluye por completo, confirmado
 * contra el Request real). `language` se persiste honestamente como preferencia — ningún
 * texto de la UI se traduce todavía según este campo (confirmado en el propio docblock del
 * backend); esta pantalla no inventa una capacidad de traducción que no existe.
 */
export function PerfilDatosForm({ user, onSuccess }: { user: AuthenticatedUser; onSuccess: (user: AuthenticatedUser) => void }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { handleSubmit, control } = useForm<DatosValues>({
    resolver: zodResolver(datosSchema),
    defaultValues: {
      theme: (user.theme as "light" | "dark" | "system") ?? "system",
      language: (user.language as "es" | "en") ?? "es",
      timezone: user.timezone || "America/Bogota",
    },
  });

  async function onSubmit(values: DatosValues) {
    setStatus("submitting");
    setError(null);
    setSuccess(false);
    try {
      const updated = await actualizarPerfil(values);
      onSuccess(updated);
      setSuccess(true);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo actualizar el perfil."));
    } finally {
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
      {success ? (
        <Alert>
          <AlertDescription>Preferencias guardadas.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="perfil-theme">Tema</Label>
          <Controller
            control={control}
            name="theme"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "system")}>
                <SelectTrigger id="perfil-theme">
                  <SelectValue>{(v: string) => ({ light: "Claro", dark: "Oscuro", system: "Sistema" })[v]}</SelectValue>
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
          <Label htmlFor="perfil-language">Idioma</Label>
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "es")}>
                <SelectTrigger id="perfil-language">
                  <SelectValue>{(v: string) => ({ es: "Español", en: "English" })[v]}</SelectValue>
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
          <Label htmlFor="perfil-timezone">Zona horaria</Label>
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "America/Bogota")}>
                <SelectTrigger id="perfil-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions(user.timezone || "America/Bogota").map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-fit">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar preferencias
      </Button>
    </form>
  );
}
