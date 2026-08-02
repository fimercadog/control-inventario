"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { getAuditLog } from "@/lib/api/auditoria";
import type { AuditLog } from "@/lib/api/types";

/**
 * Ficha de un evento de auditoría (2026-08-02,
 * docs/03_FUNCTIONAL_SPEC/Auditoria.md). 100% de solo lectura — no hay
 * "Editar": AuditLog es inmutable. "Usuario" muestra el email de la
 * cuenta y sus roles, nunca el nombre real de la persona (regla de
 * privacidad no negociable).
 */
export function AuditLogDetailScreen({ auditLogId }: { auditLogId: number }) {
  const router = useRouter();

  const [registro, setRegistro] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(auditLogId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    getAuditLog(auditLogId)
      .then(setRegistro)
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el evento de auditoría.");
        }
      })
      .finally(() => setLoading(false));
  }, [auditLogId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando evento...
      </div>
    );
  }

  if (notFound || !registro) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/auditoria")}>
          <ArrowLeft className="size-4" />
          Volver a Auditoría
        </Button>
        <EmptyState
          icon={ScrollText}
          title="No encontramos este evento"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/auditoria")}>
        <ArrowLeft className="size-4" />
        Volver a Auditoría
      </Button>

      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ScrollText className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{registro.accion}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              className={
                registro.resultado === "exitoso"
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-muted text-muted-foreground"
              }
            >
              {registro.resultado ?? "—"}
            </Badge>
            <span>{registro.created_at ? new Date(registro.created_at).toLocaleString("es-CO") : "—"}</span>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoRow label="Módulo" value={registro.modulo} />
            <InfoRow label="Registro afectado" value={registro.auditable_type ? `${registro.auditable_type} #${registro.auditable_id}` : "—"} />
            <InfoRow label="IP" value={registro.ip ?? "—"} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Usuario</span>
            {registro.usuario ? (
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm">{registro.usuario.email}</span>
                {registro.usuario.roles.map((rol) => (
                  <Badge key={rol} variant="outline" className="font-normal">
                    {rol}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Sistema (sin usuario asociado)</span>
            )}
          </div>

          {registro.user_agent && (
            <InfoRow label="Dispositivo / Navegador" value={registro.user_agent} />
          )}

          {(registro.valores_anteriores || registro.valores_nuevos) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {registro.valores_anteriores && (
                <ValoresPanel titulo="Estado anterior" valores={registro.valores_anteriores} />
              )}
              {registro.valores_nuevos && (
                <ValoresPanel titulo="Estado nuevo" valores={registro.valores_nuevos} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ValoresPanel({ titulo, valores }: { titulo: string; valores: Record<string, unknown> }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{titulo}</span>
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
        {JSON.stringify(valores, null, 2)}
      </pre>
    </div>
  );
}
