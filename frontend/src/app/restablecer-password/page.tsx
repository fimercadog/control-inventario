"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  return <ResetPasswordForm token={token} email={email} />;
}

export default function RestablecerPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <span className="text-2xl font-semibold tracking-tight text-foreground">FidelOS</span>
          <span className="text-sm text-muted-foreground">Restablecer contraseña</span>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </main>
  );
}
