"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CrudModal, Field } from "@/components/crud-modal";
import { createProveedor, updateProveedor } from "@/lib/api/proveedores";
import type { Proveedor, StoreProveedorPayload } from "@/lib/api/types";

const EMPTY_FORM: StoreProveedorPayload = {
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
 * `proveedor` presente = modo edición, ausente = modo creación.
 * Reemplaza `NewSupplierDialog` + el formulario inline de
 * `SupplierDetailScreen`.
 */
export function ProveedorFormModal({
  open,
  onOpenChange,
  proveedor,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: Proveedor | null;
  onSaved: (proveedor: Proveedor) => void;
}) {
  const isEdit = proveedor != null;
  const [form, setForm] = useState<StoreProveedorPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nombre: proveedor?.nombre ?? "",
        nit: proveedor?.nit ?? "",
        contacto: proveedor?.contacto ?? "",
        telefono: proveedor?.telefono ?? "",
        email: proveedor?.email ?? "",
        direccion: proveedor?.direccion ?? "",
        ciudad: proveedor?.ciudad ?? "",
        pais: proveedor?.pais ?? "",
        notas: proveedor?.notas ?? "",
      });
    }
  }, [open, proveedor]);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("La razón social es obligatoria.");
      return;
    }
    setSaving(true);
    try {
      const resultado = isEdit ? await updateProveedor(proveedor.id, form) : await createProveedor(form);
      toast.success(isEdit ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente");
      onOpenChange(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar el proveedor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
      size="md"
      onSubmit={save}
      submitLabel={isEdit ? "Guardar cambios" : "Crear proveedor"}
      saving={saving}
    >
      <Field label="Razón Social *">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="NIT / Tax ID">
          <Input value={form.nit ?? ""} onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))} />
        </Field>
        <Field label="Contacto">
          <Input value={form.contacto ?? ""} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Teléfono">
          <Input value={form.telefono ?? ""} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
      </div>
      <Field label="Dirección">
        <Input value={form.direccion ?? ""} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ciudad">
          <Input value={form.ciudad ?? ""} onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))} />
        </Field>
        <Field label="País">
          <Input value={form.pais ?? ""} onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))} />
        </Field>
      </div>
      <Field label="Notas">
        <Input value={form.notas ?? ""} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
      </Field>
    </CrudModal>
  );
}
