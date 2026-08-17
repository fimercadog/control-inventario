"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { subirAvatarUsuario, eliminarAvatarUsuario } from "@/lib/api/users";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { initialsFor } from "@/lib/utils/format";
import type { Usuario } from "@/types/user";

const MAX_AVATAR_BYTES = 2048 * 1024; // matches UploadAvatarRequest: image, max:2048 (KB)

export function AvatarForm({
  usuario,
  onSuccess,
}: {
  usuario: Usuario;
  onSuccess: (updated: Usuario) => void;
}) {
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
      const updated = await subirAvatarUsuario(usuario.id, file);
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
      const updated = await eliminarAvatarUsuario(usuario.id);
      onSuccess(updated);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo quitar el avatar."));
    } finally {
      setStatus("idle");
    }
  }

  const isBusy = status !== "idle";

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

      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {usuario.avatar_url ? <AvatarImage src={usuario.avatar_url} alt="" /> : null}
          <AvatarFallback>{initialsFor(usuario.name)}</AvatarFallback>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {status === "uploading" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {usuario.avatar_url ? "Cambiar avatar" : "Subir avatar"}
          </Button>
          {usuario.avatar_url ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={isBusy}
              onClick={handleRemove}
            >
              {status === "removing" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Quitar avatar
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
