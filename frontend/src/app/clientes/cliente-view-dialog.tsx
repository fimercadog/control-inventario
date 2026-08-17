"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClienteDetail } from "@/hooks/use-cliente-detail";
import { fetchCliente } from "@/lib/api/clientes";
import { formatDateTime } from "@/lib/utils/format";
import type { Cliente } from "@/types/cliente";

/** No Productos tab here — unlike Proveedores, ClienteController has no such endpoint
 * (verified: no /clientes/{id}/productos route in routes/api.php). A single Detalle view. */
export function ClienteViewDialog({
  clienteId,
  onClose,
  canEdit,
  canDisable,
  togglingId,
  onEdit,
  onToggleEstado,
}: {
  clienteId: number | null;
  onClose: () => void;
  canEdit: boolean;
  canDisable: boolean;
  togglingId: number | null;
  onEdit: (cliente: Cliente) => void;
  onToggleEstado: (cliente: Cliente) => Promise<void>;
}) {
  const { cliente, isLoading, error, setCliente } = useClienteDetail(clienteId);

  async function handleToggle(target: Cliente) {
    await onToggleEstado(target);
    if (clienteId !== null) {
      fetchCliente(clienteId).then(setCliente).catch(() => {});
    }
  }

  return (
    <Dialog open={clienteId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cliente</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : cliente ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-foreground">{cliente.nombre}</span>
              {cliente.estado === "activo" ? (
                <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
              ) : (
                <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NIT" value={cliente.nit ?? "—"} />
              <Field label="Email" value={cliente.email ?? "—"} />
              <Field label="Contacto" value={cliente.contacto ?? "—"} />
              <Field label="Teléfono" value={cliente.telefono ?? "—"} />
              <Field label="Dirección" value={cliente.direccion ?? "—"} />
              <Field label="Ciudad / País" value={[cliente.ciudad, cliente.pais].filter(Boolean).join(" / ") || "—"} />
              <Field label="Creado" value={formatDateTime(cliente.created_at)} />
              <Field label="Actualizado" value={formatDateTime(cliente.updated_at)} />
            </div>

            {cliente.notas ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas</p>
                <p className="text-sm text-foreground">{cliente.notas}</p>
              </div>
            ) : null}

            {canEdit || canDisable ? (
              <div className="flex flex-wrap gap-2">
                {canEdit ? (
                  <Button variant="outline" size="sm" onClick={() => onEdit(cliente)}>
                    Editar
                  </Button>
                ) : null}
                {(cliente.estado === "activo" ? canDisable : canEdit) ? (
                  <Button
                    variant={cliente.estado === "activo" ? "destructive" : "outline"}
                    className={
                      cliente.estado === "activo"
                        ? undefined
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }
                    size="sm"
                    disabled={togglingId === cliente.id}
                    onClick={() => handleToggle(cliente)}
                  >
                    {togglingId === cliente.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    {cliente.estado === "activo" ? "Deshabilitar" : "Habilitar"}
                  </Button>
                ) : null}
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
