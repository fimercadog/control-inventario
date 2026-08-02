"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Camera, Loader2, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  changePasswordThunk,
  logoutThunk,
  removeAvatarThunk,
  updateProfileThunk,
  uploadAvatarThunk,
} from "@/store/slices/auth-slice";
import { setAccessToken } from "@/lib/api/auth-token";

const THEME_ITEMS: Record<string, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" };
const LANGUAGE_ITEMS: Record<string, string> = { es: "Español", en: "English" };

/**
 * Perfil (2026-08-02, docs/03_FUNCTIONAL_SPEC/Profile.md). Único dueño de
 * avatar/tema/idioma/zona horaria — Configuración ya no duplica el
 * selector de tema, para no tener dos fuentes de verdad del mismo estado.
 */
export default function PerfilPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [language, setLanguage] = useState(user?.language ?? "es");
  const [timezone, setTimezone] = useState(user?.timezone ?? "America/Bogota");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function guardarDatosPersonales() {
    setSavingPersonal(true);
    try {
      await dispatch(updateProfileThunk({ name, language: language as "es" | "en", timezone })).unwrap();
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos guardar los cambios.");
    } finally {
      setSavingPersonal(false);
    }
  }

  async function cambiarTema(nuevoTema: "light" | "dark" | "system") {
    setTheme(nuevoTema);
    try {
      await dispatch(updateProfileThunk({ theme: nuevoTema })).unwrap();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos guardar el tema.");
    }
  }

  async function subirAvatar(archivo: File) {
    setUploadingAvatar(true);
    try {
      await dispatch(uploadAvatarThunk(archivo)).unwrap();
      toast.success("Avatar actualizado correctamente");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos subir el avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function eliminarAvatar() {
    setUploadingAvatar(true);
    try {
      await dispatch(removeAvatarThunk()).unwrap();
      toast.success("Avatar eliminado");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos eliminar el avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function cambiarPassword() {
    setChangingPassword(true);
    try {
      await dispatch(
        changePasswordThunk({
          password_actual: passwordActual,
          password: passwordNueva,
          password_confirmation: passwordConfirmacion,
        })
      ).unwrap();
      toast.success("Contraseña actualizada. Inicia sesión de nuevo.");
      await dispatch(logoutThunk());
      setAccessToken(null);
      router.push("/login");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos cambiar la contraseña.");
    } finally {
      setChangingPassword(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">Tus datos personales, preferencias y seguridad.</p>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-16">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-1">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {user.empresa && (
                <Badge variant="outline" className="font-normal">
                  {user.empresa.nombre}
                </Badge>
              )}
              {user.roles.map((rol) => (
                <Badge key={rol} className="gap-1 font-normal">
                  <ShieldCheck className="size-3" />
                  {rol}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  Sin rol asignado
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
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
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="size-4" />
              Cambiar
            </Button>
            {user.avatar_url && (
              <Button
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
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
          <CardDescription>{user.permissions.length} permisos efectivos, vía tu(s) rol(es).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Correo</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Idioma</Label>
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
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Zona horaria</Label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>
          <Button className="w-fit gap-2" onClick={guardarDatosPersonales} disabled={savingPersonal}>
            <Save className="size-4" />
            {savingPersonal ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
          <CardDescription>Elige cómo se ve la aplicación para ti.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select items={THEME_ITEMS} value={user.theme} onValueChange={(v) => v && cambiarTema(v as "light" | "dark" | "system")}>
            <SelectTrigger className="w-48">
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
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Seguridad</CardTitle>
          <CardDescription>Cambiar tu contraseña cierra todas tus sesiones activas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Contraseña actual</Label>
            <Input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Nueva contraseña</Label>
              <Input
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Confirmar nueva contraseña</Label>
              <Input
                type="password"
                value={passwordConfirmacion}
                onChange={(e) => setPasswordConfirmacion(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="w-fit gap-2"
            disabled={changingPassword || !passwordActual || !passwordNueva}
            onClick={cambiarPassword}
          >
            {changingPassword ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
