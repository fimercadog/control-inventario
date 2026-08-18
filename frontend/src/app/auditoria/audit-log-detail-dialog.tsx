"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/format";
import type { AuditLogEntry } from "@/types/audit-log";

export function AuditLogDetailDialog({ entry, onClose }: { entry: AuditLogEntry | null; onClose: () => void }) {
  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evento de auditoría</DialogTitle>
        </DialogHeader>
        {entry ? (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Módulo" value={entry.modulo} />
              <Field label="Acción" value={entry.accion} />
              <Field
                label="Usuario"
                value={entry.usuario ? `${entry.usuario.email} (${entry.usuario.roles.join(", ") || "sin rol"})` : "—"}
              />
              <Field label="Resultado" value={entry.resultado ?? "—"} />
              <Field label="Fecha" value={formatDateTime(entry.created_at)} />
              <Field label="IP" value={entry.ip ?? "—"} />
              {entry.auditable_type ? (
                <Field label="Recurso" value={`${entry.auditable_type.split("\\").pop()} #${entry.auditable_id}`} />
              ) : null}
            </div>

            {entry.valores_anteriores ? (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Valores anteriores
                </p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground">
                  {JSON.stringify(entry.valores_anteriores, null, 2)}
                </pre>
              </div>
            ) : null}

            {entry.valores_nuevos ? (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Valores nuevos
                </p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground">
                  {JSON.stringify(entry.valores_nuevos, null, 2)}
                </pre>
              </div>
            ) : null}

            {entry.user_agent ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User agent</p>
                <p className="text-xs text-muted-foreground">{entry.user_agent}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
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

// `resultado` viene de dos fuentes (AuditLogger::registrarAccionManual /
// ::registrarCapturaIA): "exitoso" para acciones manuales, o el estado real
// de CapturaIA (aplicado/parcial/pendiente_revision/descartado/procesando)
// para auditoría de captura IA. No es un simple booleano éxito/fallo.
const RESULTADO_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  exitoso: "success",
  aplicado: "success",
  parcial: "warning",
  pendiente_revision: "warning",
  descartado: "outline",
  procesando: "outline",
};

export function ResultadoBadge({ resultado }: { resultado: string | null }) {
  if (!resultado) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant={RESULTADO_VARIANT[resultado] ?? "destructive"}>{resultado}</Badge>
  );
}
