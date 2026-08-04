"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CrudModal, Field } from "@/components/crud-modal";
import { useAppDispatch } from "@/store/hooks";
import { createClienteThunk, updateClienteThunk } from "@/store/slices/clientes-slice";
import type { Cliente, StoreClientePayload } from "@/lib/api/types";

const EMPTY_FORM: StoreClientePayload = {
  nombre: "",
  nit: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
  ciudad: "",
  pais: "",
  notas: "",
};

/**
 * Global UI Standard (2026-08-03). Un solo modal para Crear y Editar —
 * `cliente` presente = modo edición, ausente = modo creación. Reemplaza
 * `NewClienteDialog` + el formulario inline de `ClienteDetailScreen`.
 * `notas` ahora aparece también al crear (el tipo ya lo aceptaba, la
 * versión anterior de "Nuevo Cliente" simplemente no lo mostraba).
 */
export function ClienteFormModal({
  open,
  onOpenChange,
  cliente,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSaved: (cliente: Cliente) => void;
}) {
  const dispatch = useAppDispatch();
  const isEdit = cliente != null;
  const [form, setForm] = useState<StoreClientePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nombre: cliente?.nombre ?? "",
        nit: cliente?.nit ?? "",
        contacto: cliente?.contacto ?? "",
        telefono: cliente?.telefono ?? "",
        email: cliente?.email ?? "",
        direccion: cliente?.direccion ?? "",
        ciudad: cliente?.ciudad ?? "",
        pais: cliente?.pais ?? "",
        notas: cliente?.notas ?? "",
      });
    }
  }, [open, cliente]);

  function setField<K extends keyof StoreClientePayload>(key: K, value: StoreClientePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const resultado = isEdit
        ? await dispatch(updateClienteThunk({ id: cliente.id, payload: form })).unwrap()
        : await dispatch(createClienteThunk(form)).unwrap();
      toast.success(isEdit ? "Cliente actualizado correctamente" : "Cliente creado correctamente");
      onOpenChange(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Cliente" : "Nuevo Cliente"}
      size="md"
      onSubmit={save}
      submitLabel={isEdit ? "Guardar cambios" : "Crear cliente"}
      saving={saving}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre *">
          <Input value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} autoFocus />
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
          <Input type="email" value={form.email ?? ""} onChange={(e) => setField("email", e.target.value)} />
        </Field>
        <Field label="Ciudad">
          <Input value={form.ciudad ?? ""} onChange={(e) => setField("ciudad", e.target.value)} />
        </Field>
        <Field label="País">
          <Input value={form.pais ?? ""} onChange={(e) => setField("pais", e.target.value)} />
        </Field>
        <Field label="Dirección">
          <Input value={form.direccion ?? ""} onChange={(e) => setField("direccion", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notas">
            <Input value={form.notas ?? ""} onChange={(e) => setField("notas", e.target.value)} />
          </Field>
        </div>
      </div>
    </CrudModal>
  );
}
