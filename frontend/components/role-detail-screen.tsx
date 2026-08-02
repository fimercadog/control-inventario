"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle2, Loader2, Mail, Pencil, Save, ShieldCheck, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PermissionPicker } from "@/components/permission-picker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateRoleThunk, desactivarRoleThunk, activarRoleThunk, fetchCatalogoPermisos } from "@/store/slices/roles-slice";
import { getRole, listUsuariosDeRole } from "@/lib/api/roles";
import type { Role, UsuarioAsignadoRol } from "@/lib/api/types";

/**
 * Ficha de Rol (Módulo 5, 2026-08-02, docs/security/ROLES_MATRIX.md) —
 * mismo patrón de navegación unificada que Cliente/Proveedor. La pestaña
 * "Usuarios" es de solo lectura (reasignar un usuario a otro rol vive en
 * la Ficha de Usuario, no se duplica aquí) — existe para que el mensaje
 * de error 409 al desactivar ("tiene usuarios asignados") sea accionable:
 * el usuario puede ver inmediatamente A QUIÉNES tiene que reasignar.
 */
export function RoleDetailScreen({ roleId }: { roleId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { catalogoPermisos, catalogoLoading } = useAppSelector((state) => state.roles);

  const [role, setRole] = useState<Role | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAsignadoRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(searchParams.get("editar") === "1");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [permisos, setPermisos] = useState<string[]>([]);
  const [confirmandoCambioEstado, setConfirmandoCambioEstado] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(roleId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    Promise.all([getRole(roleId), listUsuariosDeRole(roleId)])
      .then(([roleResult, usuariosResult]) => {
        setRole(roleResult);
        setUsuarios(usuariosResult);
        setName(roleResult.name);
        setPermisos(roleResult.permisos ?? []);
      })
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el rol.");
        }
      })
      .finally(() => setLoading(false));
  }, [roleId]);

  useEffect(() => {
    if (editing && catalogoPermisos.length === 0) {
      dispatch(fetchCatalogoPermisos());
    }
  }, [editing, catalogoPermisos.length, dispatch]);

  async function save() {
    if (!role) return;
    setSaving(true);
    try {
      const actualizado = await dispatch(
        updateRoleThunk({ id: role.id, payload: { name, permisos } })
      ).unwrap();
      setRole(actualizado);
      setEditing(false);
      toast.success("Rol actualizado correctamente");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstado() {
    if (!role) return;
    try {
      const actualizado =
        role.estado === "activo"
          ? await dispatch(desactivarRoleThunk(role.id)).unwrap()
          : await dispatch(activarRoleThunk(role.id)).unwrap();
      setRole(actualizado);
      toast.success(actualizado.estado === "activo" ? "Rol activado" : "Rol desactivado");
    } catch (error) {
      // El backend explica exactamente por qué (409: "tiene usuarios
      // asignados, reasígnalos primero") — se muestra tal cual, no un
      // mensaje genérico, porque la pestaña Usuarios de abajo ya deja ver
      // a quiénes hay que reasignar.
      toast.error(typeof error === "string" ? error : "No pudimos actualizar el estado.");
    } finally {
      setConfirmandoCambioEstado(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando rol...
      </div>
    );
  }

  if (notFound || !role) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/roles")}>
          <ArrowLeft className="size-4" />
          Volver a Roles
        </Button>
        <EmptyState
          icon={ShieldCheck}
          title="No encontramos este rol"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/roles")}>
          <ArrowLeft className="size-4" />
          Volver a Roles
        </Button>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setConfirmandoCambioEstado(true)}
            >
              {role.estado === "activo" ? (
                <>
                  <Ban className="size-4" />
                  Desactivar
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Activar
                </>
              )}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ShieldCheck className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{role.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              className={
                role.estado === "activo"
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-red-600 text-white dark:bg-red-500"
              }
            >
              {role.estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="detalle">
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios ({usuarios.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle">
          <Card className="border-border/60">
            <CardContent className="flex flex-col gap-4 pt-6">
              {editing ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Permisos</Label>
                    <PermissionPicker
                      catalogo={catalogoPermisos}
                      seleccionados={permisos}
                      onChange={setPermisos}
                      loading={catalogoLoading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setEditing(false);
                        setName(role.name);
                        setPermisos(role.permisos ?? []);
                      }}
                      disabled={saving}
                    >
                      <X className="size-4" />
                      Cancelar
                    </Button>
                    <Button className="flex-1 gap-2" onClick={save} disabled={saving}>
                      <Save className="size-4" />
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Permisos asignados" value={String(role.permisos_count ?? role.permisos?.length ?? 0)} emphasize />
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
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
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmandoCambioEstado}
        onOpenChange={setConfirmandoCambioEstado}
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
    </div>
  );
}

function InfoRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-medium" : undefined}>{value}</span>
    </div>
  );
}
