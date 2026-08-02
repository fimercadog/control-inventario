"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle2, Contact, Loader2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAppDispatch } from "@/store/hooks";
import { updateClienteThunk, disableClienteThunk, enableClienteThunk } from "@/store/slices/clientes-slice";
import { getCliente } from "@/lib/api/clientes";
import type { Cliente, UpdateClientePayload } from "@/lib/api/types";

/**
 * Ficha de Cliente (2026-08-02, docs/03_FUNCTIONAL_SPEC/Customers.md) —
 * mismo patrón de navegación unificada que Proveedor/Categoría: un solo
 * destino para ver/editar/deshabilitar un cliente.
 */
export function ClienteDetailScreen({ clienteId }: { clienteId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(searchParams.get("editar") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateClientePayload>({});
  const [confirmandoCambioEstado, setConfirmandoCambioEstado] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(clienteId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    getCliente(clienteId)
      .then((resultado) => {
        setCliente(resultado);
        setForm({
          nombre: resultado.nombre,
          nit: resultado.nit ?? "",
          contacto: resultado.contacto ?? "",
          telefono: resultado.telefono ?? "",
          email: resultado.email ?? "",
          direccion: resultado.direccion ?? "",
          ciudad: resultado.ciudad ?? "",
          pais: resultado.pais ?? "",
          notas: resultado.notas ?? "",
        });
      })
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el cliente.");
        }
      })
      .finally(() => setLoading(false));
  }, [clienteId]);

  function setField<K extends keyof UpdateClientePayload>(key: K, value: UpdateClientePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!cliente) return;
    setSaving(true);
    try {
      const actualizado = await dispatch(
        updateClienteThunk({ id: cliente.id, payload: form })
      ).unwrap();
      setCliente(actualizado);
      setEditing(false);
      toast.success("Cliente actualizado correctamente");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstado() {
    if (!cliente) return;
    try {
      const actualizado =
        cliente.estado === "activo"
          ? await dispatch(disableClienteThunk(cliente.id)).unwrap()
          : await dispatch(enableClienteThunk(cliente.id)).unwrap();
      setCliente(actualizado);
      toast.success(actualizado.estado === "activo" ? "Cliente habilitado" : "Cliente deshabilitado");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos actualizar el estado.");
    } finally {
      setConfirmandoCambioEstado(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando cliente...
      </div>
    );
  }

  if (notFound || !cliente) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="size-4" />
          Volver a Clientes
        </Button>
        <EmptyState
          icon={Contact}
          title="No encontramos este cliente"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="size-4" />
          Volver a Clientes
        </Button>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setConfirmandoCambioEstado(true)}
            >
              {cliente.estado === "activo" ? (
                <>
                  <Ban className="size-4" />
                  Eliminar
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Habilitar
                </>
              )}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Contact className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              className={
                cliente.estado === "activo"
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-red-600 text-white dark:bg-red-500"
              }
            >
              {cliente.estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          {editing ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre" className="sm:col-span-2">
                  <Input value={form.nombre ?? ""} onChange={(e) => setField("nombre", e.target.value)} />
                </Field>
                <Field label="NIT">
                  <Input value={form.nit ?? ""} onChange={(e) => setField("nit", e.target.value)} />
                </Field>
                <Field label="Contacto">
                  <Input value={form.contacto ?? ""} onChange={(e) => setField("contacto", e.target.value)} />
                </Field>
                <Field label="Teléfono">
                  <Input value={form.telefono ?? ""} onChange={(e) => setField("telefono", e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </Field>
                <Field label="Ciudad">
                  <Input value={form.ciudad ?? ""} onChange={(e) => setField("ciudad", e.target.value)} />
                </Field>
                <Field label="País">
                  <Input value={form.pais ?? ""} onChange={(e) => setField("pais", e.target.value)} />
                </Field>
                <Field label="Dirección" className="sm:col-span-2">
                  <Input value={form.direccion ?? ""} onChange={(e) => setField("direccion", e.target.value)} />
                </Field>
                <Field label="Notas" className="sm:col-span-2">
                  <Input value={form.notas ?? ""} onChange={(e) => setField("notas", e.target.value)} />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  <X className="size-4" />
                  Cancelar
                </Button>
                <Button className="flex-1 gap-2" onClick={save} disabled={saving}>
                  <Save className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmandoCambioEstado}
        onOpenChange={setConfirmandoCambioEstado}
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
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
