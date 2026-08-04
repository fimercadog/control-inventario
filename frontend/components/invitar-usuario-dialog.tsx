"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { inviteUsuario } from "@/lib/api/invitaciones";
import { listRoles } from "@/lib/api/roles";
import type { Role } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

/**
 * Módulo 6 — Invitaciones (2026-08-03, docs/03_FUNCTIONAL_SPEC/Users.md,
 * Decisión 1). Único mecanismo real de "Nuevo Usuario" del ERP — no crea
 * la cuenta directamente, envía un correo con un enlace que el invitado
 * usa para elegir su propia contraseña (`/aceptar-invitacion`).
 */
export function InvitarUsuarioDialog({ onInvited }: { onInvited?: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState("");
  // "" (nunca undefined) a propósito, incluso antes de elegir un rol —
  // Select decide controlado/no-controlado en el primer render según si
  // `value` es `undefined`; alternar entre los dos tras montar dispara
  // la advertencia de React de cambiar de no-controlado a controlado.
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (!open) return;
    listRoles({ estado: "activo" })
      .then((result) => setRoles(result.items))
      .catch(() => {});
  }, [open]);

  async function enviar() {
    if (!email) {
      toast.error("Ingresa un correo.");
      return;
    }

    setSaving(true);
    try {
      await inviteUsuario({ email, role_id: roleId ? Number(roleId) : undefined });
      toast.success(`Invitación enviada a ${email}`);
      setOpen(false);
      setEmail("");
      setRoleId("");
      onInvited?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No pudimos enviar la invitación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <UserPlus className="size-4" />
            Nuevo Usuario
          </Button>
        }
      />
      <DialogContent className={MODAL_SIZES.sm}>
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invitar-email">Correo *</Label>
            <Input
              id="invitar-email"
              type="email"
              placeholder="nombre@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Rol</Label>
            <Select
              items={{ "": "Sin rol asignado", ...Object.fromEntries(roles.map((r) => [String(r.id), r.name])) }}
              value={roleId}
              onValueChange={(value) => setRoleId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin rol asignado" />
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

          <p className="text-xs text-muted-foreground">
            Le enviaremos un correo con un enlace para que elija su propia contraseña. El enlace
            expira en 7 días.
          </p>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={enviar} disabled={saving}>
            <Send className="size-4" />
            {saving ? "Enviando..." : "Enviar invitación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
