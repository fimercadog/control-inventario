"use client";

import Link from "next/link";
import { ArrowRight, Building2, Mail, ShieldCheck, User as UserIcon, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionUser, usePermission } from "@/hooks/use-permission";

export default function DashboardPage() {
  const user = useSessionUser();
  const canViewUsuarios = usePermission("usuarios.ver");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tu sesión en FidelOS.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-semibold text-foreground">{user?.name ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Mail className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Correo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-semibold text-foreground">{user?.email ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Building2 className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-semibold text-foreground">
              {user?.empresa?.nombre ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-semibold text-foreground">{user?.role ?? "Sin rol"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Estado de sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="default">Sesión activa</Badge>
        </CardContent>
      </Card>

      {canViewUsuarios ? (
        <Link href="/usuarios">
          <Card className="transition-colors hover:bg-muted">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Usuarios</p>
                  <p className="text-sm text-muted-foreground">Gestionar usuarios de tu empresa</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ) : null}
    </div>
  );
}
