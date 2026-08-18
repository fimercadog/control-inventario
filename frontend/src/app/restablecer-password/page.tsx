"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { AuthLayout } from "@/components/layout/auth-layout";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  return <ResetPasswordForm token={token} email={email} />;
}

export default function RestablecerPasswordPage() {
  return (
    <AuthLayout title="Restablecer contraseña" subtitle="Ingresa tu nueva contraseña.">
      <Suspense fallback={null}>
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}
