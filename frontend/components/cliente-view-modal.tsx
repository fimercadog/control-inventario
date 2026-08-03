"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Contact, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailModal, InfoRow } from "@/components/detail-modal";
import { ClienteFormModal } from "@/components/cliente-form-modal";
import { useAppDispatch } from "@/store/hooks";
import { disableClienteThunk, enableClienteThunk } from "@/store/slices/clientes-slice";
import { getCliente } from "@/lib/api/clientes";
import type { Cliente } from "@/lib/api/types";

/**
 * Global UI Standard (2026-08-03). Reemplaza la página completa
 * `/clientes/{id}` — ver/editar/deshabilitar un cliente sin salir del
 * listado, que permanece visible detrás del modal. Sin pestañas (a
 * diferencia de Categoría/Marca/Unidad/Proveedor) — Cliente nunca tuvo
 * una relación "usado por" que mostrar.
 */
export function ClienteViewModal({
  clienteId,
  open,
  onOpenChange,
  onChanged,
}: {
  clienteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const dispatch = useAppDispatch();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!open || clienteId == null) return;
    setLoading(true);
    getCliente(clienteId)
      .then(setCliente)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No pudimos cargar el cliente.");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, clienteId, onOpenChange]);

  async function cambiarEstado() {
    if (!cliente) return;
    try {
      const actualizado =
        cliente.estado === "activo"
          ? await dispatch(disableClienteThunk(cliente.id)).unwrap()
          : await dispatch(enableClienteThunk(cliente.id)).unwrap();
      setCliente(actualizado);
      toast.success(actualizado.estado === "activo" ? "Cliente habilitado" : "Cliente deshabilitado");
      onChanged();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos actualizar el estado.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <>
      <DetailModal
        open={open}
        onOpenChange={onOpenChange}
        icon={Contact}
        title={cliente?.nombre ?? ""}
        loading={loading}
        size="lg"
        badge={
          cliente && (
            <Badge
              className={
                cliente.estado === "activo"
                  ? "w-fit bg-emerald-600 text-white dark:bg-emerald-500"
                  : "w-fit bg-red-600 text-white dark:bg-red-500"
              }
            >
              {cliente.estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          )
        }
        headerActions={
          cliente && (
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirmando(true)}>
                {cliente.estado === "activo" ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {cliente.estado === "activo" ? "Eliminar" : "Habilitar"}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </>
          )
        }
      >
        {cliente && (
          <div className="grid grid-cols-2 gap-4 pt-4">
            <InfoRow label="NIT" value={cliente.nit ?? "—"} />
            <InfoRow label="Contacto" value={cliente.contacto ?? "—"} />
            <InfoRow label="Teléfono" value={cliente.telefono ?? "—"} />
            <InfoRow label="Email" value={cliente.email ?? "—"} />
            <InfoRow label="Ciudad" value={cliente.ciudad ?? "—"} />
            <InfoRow label="País" value={cliente.pais ?? "—"} />
            <InfoRow label="Dirección" value={cliente.direccion ?? "—"} />
            <InfoRow label="Notas" value={cliente.notas ?? "—"} />
          </div>
        )}
      </DetailModal>

      <ClienteFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        cliente={cliente}
        onSaved={(actualizado) => {
          setCliente(actualizado);
          onChanged();
        }}
      />

      {cliente && (
        <ConfirmDialog
          open={confirmando}
          onOpenChange={setConfirmando}
          title={cliente.estado === "activo" ? "¿Eliminar este cliente?" : "¿Habilitar este cliente?"}
          description={
            cliente.estado === "activo"
              ? `"${cliente.nombre}" se marcará como inactivo. No se elimina físicamente — puedes habilitarlo de nuevo en cualquier momento.`
              : `"${cliente.nombre}" volverá a estar activo y disponible.`
          }
          confirmLabel={cliente.estado === "activo" ? "Eliminar" : "Habilitar"}
          destructive={cliente.estado === "activo"}
          onConfirm={cambiarEstado}
        />
      )}
    </>
  );
}
