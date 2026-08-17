import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function OlvidePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <span className="text-2xl font-semibold tracking-tight text-foreground">FidelOS</span>
          <span className="text-sm text-muted-foreground">Recuperar contraseña</span>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">
            Volver a iniciar sesión
          </a>
        </p>
      </div>
    </main>
  );
}
