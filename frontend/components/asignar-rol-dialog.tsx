"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MODAL_SIZES } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { asignarRolUsuario } from "@/lib/api/usuarios";
import { listRoles } from "@/lib/api/roles";
import { ApiError } from "@/lib/api/client";
import type { Role, Usuario } from "@/lib/api/types";

/**
 * Módulo 5 — Roles, ya completo — conectado aquí el 2026-08-03 (Users.md
 * documentaba esto como pendiente hasta que Roles existiera). Reemplaza
 * el rol del usuario, nunca lo agrega a una lista — un usuario, un rol.
 *
 * `open`/`onOpenChange` opcionales (2026-08-04, ADR-015): sin ellos, el
 * componente sigue siendo autocontenido con su propio trigger (uso
 * original, embebido en `UsuarioViewModal`, sin cambios). Con ellos, el
 * padre controla la apertura y el trigger interno no se renderiza — uso
 * nuevo desde el menú de acciones de `usuarios/page.tsx`, mismo patrón
 * que `ConfirmDialog` ya usa ahí para Activar/Desactivar.
 */
export function AsignarRolDialog({
  usuario,
  onAssigned,
  open: openControlado,
  onOpenChange: onOpenChangeControlado,
}: {
  usuario: Usuario;
  onAssigned: (usuario: Usuario) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const esControlado = openControlado !== undefined;
  const [openInterno, setOpenInterno] = useState(false);
  const open = esControlado ? openControlado : openInterno;
  const setOpen = esControlado ? onOpenChangeControlado! : setOpenInterno;
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  // "" (nunca undefined) a propósito — ver el mismo comentario en
  // InvitarUsuarioDialog: evita que Select cambie de no-controlado a
  // controlado después del primer render.
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (!open) return;
    listRoles({ estado: "activo" })
      .then((result) => setRoles(result.items))
      .catch(() => {});
  }, [open]);

  async function guardar() {
    if (!roleId) {
      toast.error("Selecciona un rol.");
      return;
    }

    setSaving(true);
    try {
      const actualizado = await asignarRolUsuario(usuario.id, Number(roleId));
      toast.success("Rol asignado correctamente");
      setOpen(false);
      onAssigned(actualizado);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No pudimos asignar el rol.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!esControlado && (
        <DialogTrigger
          render={
            <Button variant="outline" size="sm" className="gap-2">
              <Shield className="size-3.5" />
              Cambiar rol
            </Button>
          }
        />
      )}
      <DialogContent className={MODAL_SIZES.xs}>
        <DialogHeader>
          <DialogTitle>Asignar rol a {usuario.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Rol</Label>
          <Select
            items={Object.fromEntries(roles.map((r) => [String(r.id), r.name]))}
            value={roleId}
            onValueChange={(value) => setRoleId(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={guardar} disabled={saving || !roleId}>
            {saving ? "Guardando..." : "Asignar rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
