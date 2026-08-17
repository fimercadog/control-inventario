"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionUser } from "@/hooks/use-permission";
import { useAppDispatch } from "@/store/hooks";
import { sessionActions } from "@/store/slices/session-slice";
import { PerfilAvatarForm } from "@/components/forms/perfil-avatar-form";
import { PerfilDatosForm } from "@/components/forms/perfil-datos-form";
import { CambiarPasswordForm } from "@/components/forms/cambiar-password-form";
import type { AuthenticatedUser } from "@/types/auth";

export default function PerfilPage() {
  const user = useSessionUser();
  const dispatch = useAppDispatch();

  function handleUpdated(updated: AuthenticatedUser) {
    dispatch(sessionActions.updateUser(updated));
  }

  if (!user) return null;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">Administra tu cuenta en FidelOS.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</p>
              <p className="text-sm text-foreground">{user.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Correo</p>
              <p className="text-sm text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rol</p>
              <p className="text-sm text-foreground">{user.role ?? "Sin rol"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Empresa</p>
              <p className="text-sm text-foreground">{user.empresa?.nombre ?? "—"}</p>
            </div>
          </div>
          <Badge className="w-fit border-border bg-muted text-muted-foreground">
            Nombre y correo no son editables aquí
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <PerfilAvatarForm user={user} onSuccess={handleUpdated} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <PerfilDatosForm user={user} onSuccess={handleUpdated} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <CambiarPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
