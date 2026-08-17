"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { asignarRolUsuario } from "@/lib/api/users";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Usuario } from "@/types/user";
import type { Role } from "@/types/role";

export function ChangeRoleForm({
  usuario,
  roles,
  onSuccess,
}: {
  usuario: Usuario;
  roles: Role[];
  onSuccess: (updated: Usuario) => void;
}) {
  const currentRole = roles.find((role) => role.name === usuario.role);
  const [roleId, setRoleId] = useState(currentRole ? String(currentRole.id) : "");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!roleId) return;
    setStatus("submitting");
    setError(null);
    try {
      const updated = await asignarRolUsuario(usuario.id, { role_id: Number(roleId) });
      onSuccess(updated);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo cambiar el rol."));
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-sm font-medium text-foreground">{usuario.name}</p>
        <p className="text-xs text-muted-foreground">{usuario.email}</p>
      </div>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="change-role">Rol</Label>
        <Select value={roleId} onValueChange={(value) => value && setRoleId(value)}>
          <SelectTrigger id="change-role" className="w-full">
            <SelectValue placeholder="Seleccionar rol" />
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

      <Button type="button" disabled={!roleId || status === "submitting"} onClick={handleSave}>
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar cambios
      </Button>
    </div>
  );
}
