"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CrudModal, Field } from "@/components/crud-modal";
import { createUnidadMedida, updateUnidadMedida } from "@/lib/api/unidades-medida";
import type { StoreUnidadMedidaPayload, UnidadMedida } from "@/lib/api/types";

const EMPTY_FORM: StoreUnidadMedidaPayload = { nombre: "", abreviatura: "" };

/**
 * Global UI Standard (2026-08-03). Un solo modal para Crear y Editar —
 * `unidad` presente = modo edición, ausente = modo creación. Reemplaza
 * `NewUnidadMedidaDialog` + el formulario inline de
 * `UnidadMedidaDetailScreen`.
 */
export function UnidadMedidaFormModal({
  open,
  onOpenChange,
  unidad,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidad?: UnidadMedida | null;
  onSaved: (unidad: UnidadMedida) => void;
}) {
  const isEdit = unidad != null;
  const [form, setForm] = useState<StoreUnidadMedidaPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ nombre: unidad?.nombre ?? "", abreviatura: unidad?.abreviatura ?? "" });
    }
  }, [open, unidad]);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const resultado = isEdit ? await updateUnidadMedida(unidad.id, form) : await createUnidadMedida(form);
      toast.success(isEdit ? "Unidad de medida actualizada correctamente" : "Unidad de medida creada correctamente");
      onOpenChange(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar la unidad de medida.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Unidad de Medida" : "Nueva Unidad de Medida"}
      onSubmit={save}
      submitLabel={isEdit ? "Guardar cambios" : "Crear unidad"}
      saving={saving}
    >
      <Field label="Nombre *">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          autoFocus
        />
      </Field>
      <Field label="Abreviatura">
        <Input
          value={form.abreviatura ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, abreviatura: e.target.value }))}
        />
      </Field>
    </CrudModal>
  );
}
