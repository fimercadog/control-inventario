"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as authService from "@/lib/auth/auth-service";
import { extractApiErrorMessage } from "@/lib/api/errors";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    password_confirmation: z.string().min(1, "Confirma tu nueva contraseña."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["password_confirmation"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setStatus("submitting");
    setError(null);
    try {
      await authService.resetPassword({ token, email, ...values });
      setStatus("success");
      setTimeout(() => router.replace("/login"), 2000);
    } catch (submitError) {
      setError(
        extractApiErrorMessage(
          submitError,
          "No pudimos restablecer tu contraseña. El enlace puede haber expirado."
        )
      );
      setStatus("error");
    }
  }

  if (!token || !email) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          El enlace de restablecimiento no es válido. Solicita uno nuevo.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "success") {
    return (
      <Alert role="status">
        <AlertDescription>
          Tu contraseña fue restablecida correctamente. Redirigiendo a iniciar sesión…
        </AlertDescription>
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
        <Label htmlFor="password">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="pr-10"
            {...register("password")}
          />
          <Button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
        <Input
          id="password_confirmation"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password_confirmation)}
          aria-describedby={errors.password_confirmation ? "password-confirmation-error" : undefined}
          {...register("password_confirmation")}
        />
        {errors.password_confirmation ? (
          <p id="password-confirmation-error" className="text-sm text-destructive">
            {errors.password_confirmation.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Restablecer contraseña
      </Button>
    </form>
  );
}
