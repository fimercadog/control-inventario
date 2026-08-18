"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { AuthLayout } from "@/components/layout/auth-layout";
import { useAppSelector } from "@/store/hooks";

export default function LoginPage() {
  const router = useRouter();
  const status = useAppSelector((state) => state.session.status);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "idle" || status === "loading" || status === "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </main>
    );
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresa con tu correo y contraseña.">
      <LoginForm />
    </AuthLayout>
  );
}
