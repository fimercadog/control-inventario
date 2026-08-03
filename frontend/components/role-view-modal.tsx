"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Mail, Pencil, ShieldCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { RoleFormModal } from "@/components/role-form-modal";
import { useAppDispatch } from "@/store/hooks";
import { desactivarRoleThunk, activarRoleThunk } from "@/store/slices/roles-slice";
import { getRole, listUsuariosDeRole } from "@/lib/api/roles";
import type { Role, UsuarioAsignadoRol } from "@/lib/api/types";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/roles/{id}`. La pestaña "Usuarios" sigue siendo de solo lectura —
 * existe para que el 409 al desactivar ("tiene usuarios asignados")
 * sea accionable, y ese mensaje del backend se sigue mostrando tal
 * cual, nunca reemplazado por un genérico.
 */
export function RoleViewModal({
  roleId,
  open,
  onOpenChange,
  onChanged,
}: {
  roleId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const dispatch = useAppDispatch();
  const [role, setRole] = useState<Role | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAsignadoRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || roleId == null) return;
    setLoading(true);
    Promise.all([getRole(roleId), listUsuariosDeRole(roleId)])
      .then(([roleResult, usuariosResult]) => {
        setRole(roleResult);
        setUsuarios(usuariosResult);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar el rol.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, roleId, onOpenChange]);

  async function cambiarEstado() {
    if (!role) return;
    try {
      const actualizado =
        role.estado === "activo"
          ? await dispatch(desactivarRoleThunk(role.id)).unwrap()
          : await dispatch(activarRoleThunk(role.id)).unwrap();
      setRole(actualizado);
      toast.success(actualizado.estado === "activo" ? "Rol activado" : "Rol desactivado");
      onChanged();
    } catch (error) {
      // El backend explica exactamente por qué (409: "tiene usuarios
      // asignados, reasígnalos primero") — se muestra tal cual, no un
      // mensaje genérico, porque la pestaña Usuarios de abajo ya deja ver
      // a quiénes hay que reasignar.
      toast.error(typeof error === "string" ? error : "No pudimos actualizar el estado.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={ShieldCheck}
        title={role?.name ?? ""}
        loading={loading}
        size="lg"
        badge={
          role && (
            <Badge
              className={
                role.estado === "activo"
                  ? "w-fit bg-emerald-600 text-white dark:bg-emerald-500"
                  : "w-fit bg-red-600 text-white dark:bg-red-500"
              }
            >
              {role.estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          )
        }
        headerActions={
          role && (
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirmando(true)}>
                {role.estado === "activo" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {role.estado === "activo" ? "Desactivar" : "Activar"}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </>
          )
        }
        tabs={
          role
            ? [
                {
                  value: "detalle",
                  label: "Detalle",
                  content: (
                    <div className="flex flex-col gap-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow
                          label="Permisos asignados"
                          value={String(role.permisos_count ?? role.permisos?.length ?? 0)}
                          emphasize
                        />
                        <InfoRow label="Usuarios asignados" value={String(usuarios.length)} emphasize />
                      </div>
                      {role.permisos && role.permisos.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-muted-foreground">Permisos</span>
                          <div className="flex flex-wrap gap-1.5">
                            {role.permisos.map((permiso) => (
                              <Badge key={permiso} variant="outline" className="font-normal">
                                {permiso}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  value: "usuarios",
                  label: `Usuarios (${usuarios.length})`,
                  content: (
                    <Card className="border-border/60 py-0">
                      <CardContent className="px-0">
                        {usuarios.length === 0 ? (
                          <EmptyState
                            icon={UserX}
                            title="Sin usuarios asignados"
                            description="Todavía ningún usuario de tu empresa tiene este rol."
                          />
                        ) : (
                          <ul className="divide-y">
                            {usuarios.map((usuario) => (
                              <li key={usuario.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Mail className="size-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{usuario.name}</span>
                                    <span className="text-xs text-muted-foreground">{usuario.email}</span>
                                  </div>
                                </div>
                                <Badge
                                  className={
                                    usuario.is_active
                                      ? "bg-emerald-600 text-white dark:bg-emerald-500"
                                      : "bg-red-600 text-white dark:bg-red-500"
                                  }
                                >
                                  {usuario.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ),
                },
              ]
            : undefined
        }
      />

      <RoleFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        role={role}
        onSaved={(actualizado) => {
          setRole(actualizado);
          onChanged();
        }}
      />

      {role && (
        <ConfirmDialog
          open={confirmando}
          onOpenChange={setConfirmando}
          title={role.estado === "activo" ? "¿Desactivar este rol?" : "¿Activar este rol?"}
          description={
            role.estado === "activo"
              ? `"${role.name}" se marcará como inactivo. Si tiene usuarios asignados, la desactivación se rechazará hasta que se reasignen a otro rol.`
              : `"${role.name}" volverá a estar activo y disponible.`
          }
          confirmLabel={role.estado === "activo" ? "Desactivar" : "Activar"}
          destructive={role.estado === "activo"}
          onConfirm={cambiarEstado}
        />
      )}
    </>
  );
}
