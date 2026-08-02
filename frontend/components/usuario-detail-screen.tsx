"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle2, Loader2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAppSelector } from "@/store/hooks";
import { activarUsuario, desactivarUsuario, getUsuario } from "@/lib/api/usuarios";
import type { Usuario } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/format";

/**
 * Ficha de Usuario (RC1 Fase 4, docs/03_FUNCTIONAL_SPEC/Users.md). Todos
 * los campos son de solo lectura — este módulo no tiene formulario de
 * edición (nombre/email pertenecen a Perfil, rol pertenece al futuro
 * módulo Roles). La única acción es Activar/Desactivar, nunca disponible
 * sobre la propia cuenta.
 */
export function UsuarioDetailScreen({ usuarioId }: { usuarioId: number }) {
  const router = useRouter();
  const usuarioActual = useAppSelector((state) => state.auth.user);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(usuarioId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    getUsuario(usuarioId)
      .then(setUsuario)
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el usuario.");
        }
      })
      .finally(() => setLoading(false));
  }, [usuarioId]);

  async function confirmarCambioEstado() {
    if (!usuario) return;
    try {
      const actualizado = usuario.is_active
        ? await desactivarUsuario(usuario.id)
        : await activarUsuario(usuario.id);
      setUsuario(actualizado);
      toast.success(usuario.is_active ? "Usuario desactivado correctamente" : "Usuario activado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando usuario...
      </div>
    );
  }

  if (notFound || !usuario) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/usuarios")}>
          <ArrowLeft className="size-4" />
          Volver a Usuarios
        </Button>
        <EmptyState
          icon={UserCog}
          title="No encontramos este usuario"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  const esUsuarioActual = usuario.id === usuarioActual?.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/usuarios")}>
          <ArrowLeft className="size-4" />
          Volver a Usuarios
        </Button>
        <Button
          size="sm"
          variant={usuario.is_active ? "destructive" : "default"}
          className="gap-2"
          disabled={esUsuarioActual && usuario.is_active}
          onClick={() => setConfirmando(true)}
        >
          {usuario.is_active ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
          {usuario.is_active ? "Desactivar" : "Activar"}
        </Button>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <UserCog className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {usuario.name}
            {esUsuarioActual && <span className="ml-2 text-sm font-normal text-muted-foreground">(tú)</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{usuario.email}</span>
            <Badge
              className={
                usuario.is_active
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-red-600 text-white dark:bg-red-500"
              }
            >
              {usuario.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="text-sm font-semibold">Actividad</h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Rol">{usuario.role ?? "Sin rol asignado"}</InfoRow>
            <InfoRow label="Última actividad">
              {usuario.last_activity_at ? formatRelativeTime(usuario.last_activity_at) : "Nunca"}
            </InfoRow>
            <InfoRow label="Última IP">{usuario.last_login_ip ?? "—"}</InfoRow>
            <InfoRow label="Último dispositivo/navegador">{usuario.last_user_agent ?? "—"}</InfoRow>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="text-sm font-semibold">Trazabilidad</h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Invitado el">{usuario.invited_at ? formatRelativeTime(usuario.invited_at) : "—"}</InfoRow>
            <InfoRow label="Invitado por">{usuario.invited_by ?? "—"}</InfoRow>
            <InfoRow label="Cuenta creada">
              {usuario.created_at ? formatRelativeTime(usuario.created_at) : "—"}
            </InfoRow>
          </div>
          <p className="text-xs text-muted-foreground">
            Nombre, correo y rol no son editables desde aquí — nombre/correo son responsabilidad del propio usuario
            en su Perfil, y la asignación de rol pertenece al futuro módulo Roles.
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title={usuario.is_active ? "¿Desactivar este usuario?" : "¿Activar este usuario?"}
        description={
          usuario.is_active
            ? `"${usuario.name}" perderá acceso inmediatamente — se cierran todas sus sesiones activas.`
            : `"${usuario.name}" podrá volver a iniciar sesión.`
        }
        confirmLabel={usuario.is_active ? "Desactivar" : "Activar"}
        destructive={usuario.is_active}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
