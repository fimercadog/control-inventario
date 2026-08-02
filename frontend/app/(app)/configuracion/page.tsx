"use client";

import Link from "next/link";
import { LogOut, Sparkles, User, Building2, ChevronRight } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/auth-slice";

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

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
          <Link href="/perfil" className="flex items-center gap-3 rounded-lg -m-2 p-2 hover:bg-muted/50">
            <Avatar className="size-12">
              {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user?.name ?? "Invitado"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <p className="text-xs text-muted-foreground">
            Avatar, tema, idioma, zona horaria y contraseña se editan desde{" "}
            <Link href="/perfil" className="font-medium text-primary hover:underline">
              Mi Perfil
            </Link>
            .
          </p>
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
