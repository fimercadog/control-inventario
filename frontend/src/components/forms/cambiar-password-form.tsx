"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cambiarPasswordPerfil } from "@/lib/api/perfil";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppDispatch } from "@/store/hooks";
import { sessionActions } from "@/store/slices/session-slice";

const passwordSchema = z
  .object({
    password_actual: z.string().min(1, "Ingresa tu contraseña actual."),
    password: z.string().min(8, "Mínimo 8 caracteres."),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["password_confirmation"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

/**
 * Al tener éxito, el backend revoca TODAS las sesiones (ProfileController::cambiarPassword,
 * mismo mecanismo que recuperación de contraseña) — redirige a /login de inmediato, el
 * access token en memoria dejará de servir en cuanto expire.
 */
export function CambiarPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password_actual: "", password: "", password_confirmation: "" },
  });

  async function onSubmit(values: PasswordValues) {
    setStatus("submitting");
    setError(null);
    try {
      await cambiarPasswordPerfil(values.password_actual, values.password, values.password_confirmation);
      dispatch(sessionActions.clearSession());
      router.replace("/login");
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo cambiar la contraseña."));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="password-actual">Contraseña actual</Label>
        <Input
          id="password-actual"
          type="password"
          aria-invalid={Boolean(errors.password_actual)}
          {...register("password_actual")}
        />
        {errors.password_actual ? <p className="text-sm text-destructive">{errors.password_actual.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password-nueva">Nueva contraseña</Label>
          <Input id="password-nueva" type="password" aria-invalid={Boolean(errors.password)} {...register("password")} />
          {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password-confirmacion">Confirmar contraseña</Label>
          <Input
            id="password-confirmacion"
            type="password"
            aria-invalid={Boolean(errors.password_confirmation)}
            {...register("password_confirmation")}
          />
          {errors.password_confirmation ? (
            <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
          ) : null}
        </div>
      </div>

      <Alert>
        <AlertDescription>Al cambiar tu contraseña, todas tus sesiones activas se cerrarán.</AlertDescription>
      </Alert>

      <Button type="submit" disabled={status === "submitting"} className="w-fit">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Cambiar contraseña
      </Button>
    </form>
  );
}
