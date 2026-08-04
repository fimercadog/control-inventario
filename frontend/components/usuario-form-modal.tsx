"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrudModal, Field } from "@/components/crud-modal";
import { LANGUAGE_ITEMS, THEME_ITEMS } from "@/lib/user-preferences";
import { removeUsuarioAvatar, updateUsuario, uploadUsuarioAvatar } from "@/lib/api/usuarios";
import { ApiError } from "@/lib/api/client";
import type { Usuario } from "@/lib/api/types";

/**
 * "Editar" administrativo (ADR-015, 2026-08-04, decisión explícita del
 * propietario del proyecto: Usuarios debe exponer un flujo Editar
 * consistente con el resto del ERP). Solo toca los campos Operational de
 * OTRO usuario — avatar/idioma/zona horaria/tema. Nombre/Correo/Empresa/
 * Platform Admin se muestran bloqueados (Identity, `Field locked`).
 * `estado`/rol/contraseña no aparecen aquí en absoluto: son Controlled,
 * cada uno con su propio flujo (Activar-Desactivar, Cambiar Rol) — la
 * contraseña de otro usuario nunca es editable por un administrador, ni
 * aquí ni en ningún otro lugar, self-service exclusivo vía Perfil.
 *
 * El avatar se sube/quita de inmediato (como en `/perfil`), fuera del
 * botón "Guardar cambios" — es su propia acción, no un campo de texto
 * pendiente de enviar.
 */
export function UsuarioFormModal({
  open,
  onOpenChange,
  usuario,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onSaved: (usuario: Usuario) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eraAbierto = useRef(false);
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("es");
  const [timezone, setTimezone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /**
   * Bug real encontrado en la verificación funcional del módulo (2026-08-04):
   * al depender de `[open, usuario]`, subir un avatar (que llama `onSaved`
   * con el usuario fresco del backend, y ese objeto nuevo llega aquí como
   * prop) reinicializaba en silencio Idioma/Zona horaria/Tema a sus valores
   * del servidor, descartando cualquier cambio ya escrito en el formulario
   * pero todavía sin guardar. El guard `eraAbierto` hace que la
   * inicialización solo ocurra en la transición cerrado→abierto, nunca por
   * un cambio de referencia de `usuario` mientras el modal ya está abierto
   * — `avatarUrl` se sigue actualizando en vivo desde `subirAvatar`/
   * `eliminarAvatar` directamente, no depende de este efecto para eso.
   */
  useEffect(() => {
    if (open && !eraAbierto.current && usuario) {
      setTheme(usuario.theme ?? "system");
      setLanguage(usuario.language ?? "es");
      setTimezone(usuario.timezone ?? "");
      setAvatarUrl(usuario.avatar_url);
    }
    eraAbierto.current = open;
  }, [open, usuario]);

  if (!usuario) return null;

  const initials = usuario.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function guardar() {
    if (!usuario) return;
    setSaving(true);
    try {
      const actualizado = await updateUsuario(usuario.id, {
        theme: theme as "light" | "dark" | "system",
        language: language as "es" | "en",
        timezone,
      });
      toast.success("Usuario actualizado correctamente");
      onOpenChange(false);
      onSaved(actualizado);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function subirAvatar(archivo: File) {
    if (!usuario) return;
    setUploadingAvatar(true);
    try {
      const actualizado = await uploadUsuarioAvatar(usuario.id, archivo);
      setAvatarUrl(actualizado.avatar_url);
      toast.success("Avatar actualizado correctamente");
      onSaved(actualizado);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No pudimos subir el avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function eliminarAvatar() {
    if (!usuario) return;
    setUploadingAvatar(true);
    try {
      const actualizado = await removeUsuarioAvatar(usuario.id);
      setAvatarUrl(null);
      toast.success("Avatar eliminado");
      onSaved(actualizado);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No pudimos eliminar el avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Editar ${usuario.name}`}
      description="Solo los campos operativos son editables — identidad, rol, estado y contraseña tienen su propio flujo."
      size="md"
      onSubmit={guardar}
      submitLabel="Guardar cambios"
      saving={saving}
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={usuario.name} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subirAvatar(archivo);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="size-4" />
            Cambiar
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              disabled={uploadingAvatar}
              onClick={eliminarAvatar}
            >
              <Trash2 className="size-4" />
              Quitar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre" locked>
          <Input value={usuario.name} disabled />
        </Field>
        <Field label="Correo" locked>
          <Input value={usuario.email} disabled />
        </Field>
        <Field label="Empresa" locked>
          <Input value={usuario.empresa?.nombre ?? "—"} disabled />
        </Field>
        <Field label="Platform Admin" locked>
          <Input value={usuario.is_platform_admin ? "Sí" : "No"} disabled />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Idioma">
          <Select items={LANGUAGE_ITEMS} value={language} onValueChange={(v) => setLanguage(v ?? "es")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Zona horaria">
          <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </Field>
      </div>

      <Field label="Tema">
        <Select items={THEME_ITEMS} value={theme} onValueChange={(v) => setTheme(v ?? "system")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(THEME_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </CrudModal>
  );
}
