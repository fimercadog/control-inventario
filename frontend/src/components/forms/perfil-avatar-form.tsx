"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { subirAvatarPerfil, eliminarAvatarPerfil } from "@/lib/api/perfil";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { initialsFor } from "@/lib/utils/format";
import type { AuthenticatedUser } from "@/types/auth";

const MAX_AVATAR_BYTES = 2048 * 1024; // matches UploadAvatarRequest: image, max:2048 (KB)

/** Self-service version of components/forms/avatar-form.tsx (Usuarios) — same UX shape, but
 * hits /perfil/avatar (no {id}, always the current user) instead of /usuarios/{id}/avatar.
 * Genuinely different endpoint and Resource type (AuthenticatedUser, not Usuario), so this is
 * a Ponytail EXTEND of the pattern, not a REUSE of the component itself. */
export function PerfilAvatarForm({ user, onSuccess }: { user: AuthenticatedUser; onSuccess: (user: AuthenticatedUser) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "removing">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El avatar debe ser una imagen.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("La imagen no puede superar 2MB.");
      return;
    }

    setStatus("uploading");
    setError(null);
    try {
      const updated = await subirAvatarPerfil(file);
      onSuccess(updated);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo actualizar el avatar."));
    } finally {
      setStatus("idle");
    }
  }

  async function handleRemove() {
    setStatus("removing");
    setError(null);
    try {
      const updated = await eliminarAvatarPerfil();
      onSuccess(updated);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo quitar el avatar."));
    } finally {
      setStatus("idle");
    }
  }

  const isBusy = status !== "idle";

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {user.avatar_url ? <AvatarImage src={user.avatar_url} alt="" /> : null}
          <AvatarFallback>{initialsFor(user.name)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Seleccionar imagen de avatar"
          />
          <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={() => fileInputRef.current?.click()}>
            {status === "uploading" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {user.avatar_url ? "Cambiar avatar" : "Subir avatar"}
          </Button>
          {user.avatar_url ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={isBusy}
              onClick={handleRemove}
            >
              {status === "removing" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Quitar avatar
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
