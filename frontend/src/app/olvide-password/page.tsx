import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function OlvidePasswordPage() {
  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para restablecerla."
      footer={
        <a href="/login" className="text-primary hover:underline">
          Volver a iniciar sesión
        </a>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
