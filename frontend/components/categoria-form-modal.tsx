"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CrudModal, Field } from "@/components/crud-modal";
import { createCategoria, updateCategoria } from "@/lib/api/categorias";
import type { Categoria, StoreCategoriaPayload } from "@/lib/api/types";

const EMPTY_FORM: StoreCategoriaPayload = { nombre: "", descripcion: "" };

/**
 * Global UI Standard (2026-08-03). Un solo modal para Crear y Editar —
 * `categoria` presente = modo edición, ausente = modo creación.
 * Reemplaza `NewCategoriaDialog` + el formulario inline de
 * `CategoriaDetailScreen`.
 */
export function CategoriaFormModal({
  open,
  onOpenChange,
  categoria,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: Categoria | null;
  onSaved: (categoria: Categoria) => void;
}) {
  const isEdit = categoria != null;
  const [form, setForm] = useState<StoreCategoriaPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nombre: categoria?.nombre ?? "",
        descripcion: categoria?.descripcion ?? "",
      });
    }
  }, [open, categoria]);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const resultado = isEdit ? await updateCategoria(categoria.id, form) : await createCategoria(form);
      toast.success(isEdit ? "Categoría actualizada correctamente" : "Categoría creada correctamente");
      onOpenChange(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar la categoría.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Categoría" : "Nueva Categoría"}
      onSubmit={save}
      submitLabel={isEdit ? "Guardar cambios" : "Crear categoría"}
      saving={saving}
    >
      <Field label="Nombre *">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          autoFocus
        />
      </Field>
      <Field label="Descripción">
        <Input
          value={form.descripcion ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
        />
      </Field>
    </CrudModal>
  );
}
