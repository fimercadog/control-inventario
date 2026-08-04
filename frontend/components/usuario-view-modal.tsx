"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { AsignarRolDialog } from "@/components/asignar-rol-dialog";
import { useAppSelector } from "@/store/hooks";
import { activarUsuario, desactivarUsuario, getUsuario } from "@/lib/api/usuarios";
import type { Usuario } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/format";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/usuarios/{id}` — sin pestañas (mismo caso que Cliente), sin Crear
 * ni Editar genérico: este módulo nunca tuvo ninguno de los dos (crear
 * es Invitar, editar es únicamente reasignar rol vía
 * `AsignarRolDialog`, ambos diálogos ya existentes, sin cambios, solo
 * reubicados aquí dentro).
 */
export function UsuarioViewModal({
  usuarioId,
  open,
  onOpenChange,
  onChanged,
}: {
  usuarioId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const usuarioActual = useAppSelector((state) => state.auth.user);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || usuarioId == null) return;
    setLoading(true);
    getUsuario(usuarioId)
      .then(setUsuario)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar el usuario.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, usuarioId, onOpenChange]);

  async function confirmarCambioEstado() {
    if (!usuario) return;
    try {
      const actualizado = usuario.is_active
        ? await desactivarUsuario(usuario.id)
        : await activarUsuario(usuario.id);
      setUsuario(actualizado);
      toast.success(usuario.is_active ? "Usuario desactivado correctamente" : "Usuario activado correctamente");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  const esUsuarioActual = usuario != null && usuario.id === usuarioActual?.id;

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={UserCog}
        title={usuario ? `${usuario.name}${esUsuarioActual ? " (tú)" : ""}` : ""}
        loading={loading}
        badge={
          usuario && (
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
          )
        }
        headerActions={
          usuario && (
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
          )
        }
      >
        {usuario && (
          <div className="flex flex-col gap-4 pt-4">
            <Card className="border-border/60">
              <CardContent className="flex flex-col gap-4 pt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Actividad</h2>
                  <AsignarRolDialog usuario={usuario} onAssigned={setUsuario} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Rol" value={usuario.role ?? "Sin rol asignado"} />
                  <InfoRow
                    label="Última actividad"
                    value={usuario.last_activity_at ? formatRelativeTime(usuario.last_activity_at) : "Nunca"}
                  />
                  <InfoRow label="Última IP" value={usuario.last_login_ip ?? "—"} />
                  <InfoRow label="Último dispositivo/navegador" value={usuario.last_user_agent ?? "—"} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="flex flex-col gap-4 pt-6">
                <h2 className="text-sm font-semibold">Trazabilidad</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow
                    label="Invitado el"
                    value={usuario.invited_at ? formatRelativeTime(usuario.invited_at) : "—"}
                  />
                  <InfoRow label="Invitado por" value={usuario.invited_by ?? "—"} />
                  <InfoRow
                    label="Cuenta creada"
                    value={usuario.created_at ? formatRelativeTime(usuario.created_at) : "—"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Nombre y correo no son editables desde aquí — son responsabilidad del propio usuario en su Perfil.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DetailModal>

      {usuario && (
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
      )}
    </>
  );
}
