"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Boxes, CheckCircle2, Loader2, Mail } from "lucide-react";
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
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const schema = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Correo inválido"),
});

type ForgotForm = z.infer<typeof schema>;

export default function OlvidePasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotForm) {
    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos procesar tu solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

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
            <p className="text-sm text-muted-foreground">Control de Inventario</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="text-lg">Recuperar contraseña</CardTitle>
            <CardDescription>
              Te enviamos un enlace a tu correo para crear una nueva contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-8 text-success" />
                <p className="text-sm text-muted-foreground">
                  Si ese correo existe en nuestro sistema, recibirás un enlace en unos minutos.
                </p>
                <Button variant="outline" className="mt-2 gap-2" render={<Link href="/login" />} nativeButton={false}>
                  <ArrowLeft className="size-4" />
                  Volver a iniciar sesión
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@empresa.com"
                      className="pl-9"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
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
                      Enviando...
                    </>
                  ) : (
                    "Enviar enlace"
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
      </motion.div>
    </div>
  );
}
