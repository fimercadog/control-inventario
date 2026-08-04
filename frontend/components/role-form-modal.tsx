"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CrudModal, Field } from "@/components/crud-modal";
import { PermissionPicker } from "@/components/permission-picker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createRoleThunk, updateRoleThunk, fetchCatalogoPermisos } from "@/store/slices/roles-slice";
import type { Role } from "@/lib/api/types";

/**
 * Global UI Standard (2026-08-03). Un solo modal para Crear y Editar —
 * `role` presente = modo edición, ausente = modo creación. Reemplaza
 * `NewRoleDialog` + el formulario inline de `RoleDetailScreen`.
 * `PermissionPicker` y el catálogo cacheado en `roles-slice` se reusan
 * sin cambios — es el mismo widget en ambos modos, como ya era.
 */
export function RoleFormModal({
  open,
  onOpenChange,
  role,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  onSaved: (role: Role) => void;
}) {
  const dispatch = useAppDispatch();
  const { catalogoPermisos, catalogoLoading } = useAppSelector((state) => state.roles);
  const isEdit = role != null;
  const [name, setName] = useState("");
  const [permisos, setPermisos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(role?.name ?? "");
      setPermisos(role?.permisos ?? []);
      if (catalogoPermisos.length === 0) {
        dispatch(fetchCatalogoPermisos());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role]);

  async function save() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const resultado = isEdit
        ? await dispatch(updateRoleThunk({ id: role.id, payload: { name, permisos } })).unwrap()
        : await dispatch(createRoleThunk({ name, permisos })).unwrap();
      toast.success(isEdit ? "Rol actualizado correctamente" : "Rol creado correctamente");
      onOpenChange(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos guardar el rol.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Rol" : "Nuevo Rol"}
      size="md"
      onSubmit={save}
      submitLabel={isEdit ? "Guardar cambios" : "Crear rol"}
      saving={saving}
    >
      <Field label="Nombre *">
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Permisos">
        <PermissionPicker catalogo={catalogoPermisos} seleccionados={permisos} onChange={setPermisos} loading={catalogoLoading} />
      </Field>
    </CrudModal>
  );
}
