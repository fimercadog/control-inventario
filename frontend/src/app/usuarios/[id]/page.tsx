"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { activarUsuario, desactivarUsuario, fetchUsuario } from "@/lib/api/users";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { Usuario } from "@/types/user";

export default function UsuarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const canView = usePermission("usuarios.ver");
  const canEdit = usePermission("usuarios.editar");

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!canView) return;
    let ignore = false;
    fetchUsuario(Number(id))
      .then((data) => {
        if (ignore) return;
        setUsuario(data);
        setErrorMessage(null);
        setLoadedId(id);
      })
      .catch((error) => {
        if (ignore) return;
        setErrorMessage(extractApiErrorMessage(error, "No se pudo cargar el usuario."));
        setLoadedId(id);
      });
    return () => {
      ignore = true;
    };
  }, [id, canView]);

  const status = loadedId !== id ? "loading" : errorMessage ? "error" : "success";

  async function handleToggleActivo() {
    if (!usuario) return;
    setIsToggling(true);
    try {
      const updated = usuario.is_active
        ? await desactivarUsuario(usuario.id)
        : await activarUsuario(usuario.id);
      setUsuario(updated);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, "No se pudo actualizar el estado del usuario."));
    } finally {
      setIsToggling(false);
    }
  }

  if (!canView) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>No tienes permiso para ver este usuario.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/usuarios" className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver a usuarios
      </Link>

      {status === "loading" ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
        </div>
      ) : status === "error" ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : usuario ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">{usuario.name}</CardTitle>
            <Badge variant={usuario.is_active ? "default" : "secondary"}>
              {usuario.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={usuario.email} />
            <Field label="Rol" value={usuario.role ?? "Sin rol"} />
            <Field label="Empresa" value={usuario.empresa?.nombre ?? "—"} />
            <Field label="Última actividad" value={formatDateTime(usuario.last_activity_at)} />
            <Field label="Última IP" value={usuario.last_login_ip ?? "—"} />
            <Field label="Invitado el" value={formatDateTime(usuario.invited_at)} />

            {canEdit ? (
              <div className="sm:col-span-2">
                <Button variant="outline" disabled={isToggling} onClick={handleToggleActivo}>
                  {isToggling ? <Loader2 className="size-4 animate-spin" /> : null}
                  {usuario.is_active ? "Desactivar usuario" : "Activar usuario"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
