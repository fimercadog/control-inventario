"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRoleDetail } from "@/hooks/use-role-detail";
import { fetchRole, fetchUsuariosDelRol } from "@/lib/api/roles";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { Role, RoleUsuario } from "@/types/role";

export function RoleViewDialog({
  roleId,
  onClose,
  canManage,
  togglingId,
  onEdit,
  onToggleEstado,
}: {
  roleId: number | null;
  onClose: () => void;
  canManage: boolean;
  togglingId: number | null;
  onEdit: (role: Role) => void;
  onToggleEstado: (role: Role) => Promise<void>;
}) {
  const { role, isLoading, error, setRole } = useRoleDetail(roleId);
  const [usuarios, setUsuarios] = useState<RoleUsuario[] | null>(null);
  const [usuariosLoadedFor, setUsuariosLoadedFor] = useState<number | null>(null);
  const [usuariosError, setUsuariosError] = useState<string | null>(null);

  useEffect(() => {
    if (roleId === null) return;
    let ignore = false;
    fetchUsuariosDelRol(roleId)
      .then((data) => {
        if (ignore) return;
        setUsuarios(data);
        setUsuariosError(null);
        setUsuariosLoadedFor(roleId);
      })
      .catch((err) => {
        if (ignore) return;
        setUsuariosError(extractApiErrorMessage(err, "No se pudieron cargar los usuarios de este rol."));
        setUsuariosLoadedFor(roleId);
      });
    return () => {
      ignore = true;
    };
  }, [roleId]);

  const usuariosLoading = roleId !== null && usuariosLoadedFor !== roleId;

  // onToggleEstado swallows its own errors (surfaced via the page's toggleError alert)
  // rather than rejecting, so re-fetching afterward is the only way to tell whether the
  // dialog's own copy of the role — a separate fetch from the list — needs updating; a
  // guarded role stays "activo" after a failed 409 attempt, and this reflects that truth
  // instead of optimistically flipping the badge.
  async function handleToggle(target: Role) {
    await onToggleEstado(target);
    if (roleId !== null) {
      fetchRole(roleId).then(setRole).catch(() => {});
    }
  }

  return (
    <Dialog open={roleId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rol</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : role ? (
          <Tabs defaultValue="detalle">
            <TabsList>
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            </TabsList>

            <TabsContent value="detalle" className="flex flex-col gap-5 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-foreground">{role.name}</span>
                {role.estado === "activo" ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="outline">Inactivo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Usuarios asignados" value={String(role.usuarios_count ?? 0)} />
                <Field label="Creado" value={formatDateTime(role.created_at)} />
                <Field label="Actualizado" value={formatDateTime(role.updated_at)} />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Permisos ({role.permisos?.length ?? 0})
                </p>
                {role.permisos && role.permisos.length > 0 ? (
                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                    {role.permisos.map((permiso) => (
                      <Badge key={permiso} variant="outline">
                        {permiso}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin permisos asignados.</p>
                )}
              </div>

              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(role)}>
                    Editar
                  </Button>
                  <Button
                    variant={role.estado === "activo" ? "destructive" : "success"}
                    size="sm"
                    disabled={togglingId === role.id}
                    onClick={() => handleToggle(role)}
                  >
                    {togglingId === role.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    {role.estado === "activo" ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="usuarios" className="pt-4">
              {usuariosError ? (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{usuariosError}</AlertDescription>
                </Alert>
              ) : usuariosLoading || usuarios === null ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando" />
                </div>
              ) : usuarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ningún usuario tiene este rol asignado.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {usuarios.map((usuario) => (
                    <li
                      key={usuario.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{usuario.name}</p>
                        <p className="text-xs text-muted-foreground">{usuario.email}</p>
                      </div>
                      {usuario.is_active ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
