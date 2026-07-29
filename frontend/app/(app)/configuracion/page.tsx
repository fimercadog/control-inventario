"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sparkles, Sun, User, Monitor, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/auth-slice";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Patrón recomendado por next-themes: evita el mismatch de hidratación
    // (el tema real solo se conoce en el cliente), no un caso de "cascading
    // render" derivable de otro estado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  async function handleLogout() {
    await dispatch(logoutThunk());
    router.push("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajustes básicos de tu cuenta y la empresa.</p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Cuenta
          </CardTitle>
          <CardDescription>Tu información de sesión.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name ?? "Invitado"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Separator />
          <Button variant="outline" className="w-fit gap-2" onClick={handleLogout}>
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4" />
            Empresa
          </CardTitle>
          <CardDescription>Datos generales de tu negocio.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <Input defaultValue="Fidel OS Demo" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Zona horaria</Label>
            <Input defaultValue="America/Bogota" disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
          <CardDescription>Elige cómo se ve la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = mounted && theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-border"
                  }`}
                >
                  <Icon className="size-5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            Captura IA
          </CardTitle>
          <CardDescription>Umbral de confianza para aplicar automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
            <div>
              <p className="text-sm font-medium">Aplicar automáticamente desde</p>
              <p className="text-xs text-muted-foreground">
                Por debajo de este porcentaje, la captura espera tu revisión.
              </p>
            </div>
            <span className="text-2xl font-semibold tabular-nums text-primary">85%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
