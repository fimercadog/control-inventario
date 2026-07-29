"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Boxes, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const schema = z
  .object({
    password: z.string().min(8, "Debe tener al menos 8 caracteres"),
    passwordConfirmation: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirmation"],
  });

type ResetForm = z.infer<typeof schema>;

function RestablecerPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  async function onSubmit(values: ResetForm) {
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, email, values.password, values.passwordConfirmation);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos restablecer tu contraseña.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-border/60 shadow-xl shadow-black/5">
      <CardHeader>
        <CardTitle className="text-lg">Restablecer contraseña</CardTitle>
        <CardDescription>Elige una nueva contraseña para tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        {!token || !email ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Este enlace es inválido o incompleto. Solicita uno nuevo.
            </p>
            <Button render={<Link href="/olvide-password" />} nativeButton={false}>
              Solicitar nuevo enlace
            </Button>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-8 text-success" />
            <p className="text-sm text-muted-foreground">
              Tu contraseña fue restablecida. Te llevamos al inicio de sesión...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="passwordConfirmation">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="passwordConfirmation"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="new-password"
                  aria-invalid={!!errors.passwordConfirmation}
                  {...register("passwordConfirmation")}
                />
              </div>
              {errors.passwordConfirmation && (
                <p className="text-xs text-destructive">{errors.passwordConfirmation.message}</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-2 h-11 text-base" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Restablecer contraseña"
              )}
            </Button>

            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" render={<Link href="/login" />} nativeButton={false}>
              <ArrowLeft className="size-3.5" />
              Volver a iniciar sesión
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <div className="relative flex min-h-svh flex-1 items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary),transparent_88%),transparent_45%),radial-gradient(circle_at_80%_75%,color-mix(in_oklch,var(--success),transparent_90%),transparent_50%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Boxes className="size-7" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Fidel OS</h1>
            <p className="text-sm text-muted-foreground">AI Inventory Agent</p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <RestablecerPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
