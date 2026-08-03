"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CrudModal, Field } from "@/components/crud-modal";
import { createMarca, updateMarca } from "@/lib/api/marcas";
import type { Marca, StoreMarcaPayload } from "@/lib/api/types";

const EMPTY_FORM: StoreMarcaPayload = { nombre: "" };

/**
 * Global UI Standard (2026-08-03). Un solo modal para Crear y Editar —
 * `marca` presente = modo edición, ausente = modo creación. Reemplaza
 * `NewMarcaDialog` + el formulario inline de `MarcaDetailScreen`.
 */
export function MarcaFormModal({
  open,
  onOpenChange,
  marca,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marca?: Marca | null;
  onSaved: (marca: Marca) => void;
}) {
  const isEdit = marca != null;
  const [form, setForm] = useState<StoreMarcaPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ nombre: marca?.nombre ?? "" });
    }
  }, [open, marca]);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const resultado = isEdit ? await updateMarca(marca.id, form) : await createMarca(form);
      toast.success(isEdit ? "Marca actualizada correctamente" : "Marca creada correctamente");
      onOpenChange(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar la marca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Marca" : "Nueva Marca"}
      onSubmit={save}
      submitLabel={isEdit ? "Guardar cambios" : "Crear marca"}
      saving={saving}
    >
      <Field label="Nombre *">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          autoFocus
        />
      </Field>
    </CrudModal>
  );
}
