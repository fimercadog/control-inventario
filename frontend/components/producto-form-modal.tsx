"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CrudModal, Field } from "@/components/crud-modal";
import { createProducto, updateProducto } from "@/lib/api/productos";
import type { Producto, StoreProductoPayload } from "@/lib/api/types";

const EMPTY_FORM: StoreProductoPayload = {
  nombre: "",
  codigo: "",
  marca_nuevo: "",
  presentacion: "",
  costo: 0,
  precio: 0,
  unidad_medida_nuevo: "",
  stock_minimo: 0,
};

/**
 * Global UI Standard (2026-08-03). Un solo modal para Crear y Editar —
 * `producto` presente = modo edición, ausente = modo creación.
 * Reemplaza `NewProductDialog` + el formulario inline de
 * `ProductDetailScreen`. `stock_actual` nunca aparece aquí en ninguno
 * de los dos modos — es propiedad exclusiva de `InventoryService`,
 * solo se muestra de solo lectura en el modo edición para dar contexto.
 * `categoria_id`/`codigo_barras` tampoco tienen campo aquí — ninguno de
 * los dos formularios que este componente reemplaza los exponía.
 */
export function ProductoFormModal({
  open,
  onOpenChange,
  producto,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: Producto | null;
  onSaved: (producto: Producto) => void;
}) {
  const isEdit = producto != null;
  const [form, setForm] = useState<StoreProductoPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nombre: producto?.nombre ?? "",
        codigo: producto?.codigo ?? "",
        marca_nuevo: producto?.marca ?? "",
        presentacion: producto?.presentacion ?? "",
        descripcion: producto?.descripcion ?? "",
        costo: producto?.costo ?? 0,
        precio: producto?.precio ?? 0,
        unidad_medida_nuevo: producto?.unidad_medida ?? "",
        stock_minimo: producto?.stock_minimo ?? 0,
        stock_maximo: producto?.stock_maximo ?? null,
      });
    }
  }, [open, producto]);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const resultado = isEdit ? await updateProducto(producto.id, form) : await createProducto(form);
      toast.success(isEdit ? "Producto actualizado correctamente" : "Producto creado correctamente");
      onOpenChange(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Producto" : "Nuevo Producto"}
      onSubmit={save}
      submitLabel={isEdit ? "Guardar cambios" : "Crear producto"}
      saving={saving}
    >
      <Field label="Nombre *">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          autoFocus
        />
      </Field>
      {!isEdit && (
        <Field label="Código">
          <Input value={form.codigo ?? ""} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marca">
          <Input
            value={form.marca_nuevo ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, marca_nuevo: e.target.value }))}
          />
        </Field>
        <Field label="Presentación">
          <Input
            value={form.presentacion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, presentacion: e.target.value }))}
          />
        </Field>
      </div>
      {isEdit && (
        <Field label="Descripción">
          <Input
            value={form.descripcion ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Costo">
          <Input
            type="number"
            min={0}
            value={form.costo ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) }))}
          />
        </Field>
        <Field label="Precio">
          <Input
            type="number"
            min={0}
            value={form.precio ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unidad de medida">
          <Input
            value={form.unidad_medida_nuevo ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, unidad_medida_nuevo: e.target.value }))}
          />
        </Field>
        <Field label="Stock mínimo">
          <Input
            type="number"
            min={0}
            value={form.stock_minimo ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, stock_minimo: Number(e.target.value) }))}
          />
        </Field>
      </div>
      {isEdit ? (
        <>
          <Field label="Stock máximo">
            <Input
              type="number"
              min={0}
              value={form.stock_maximo ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock_maximo: e.target.value === "" ? null : Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="Stock actual">
            <Input type="text" value={producto.stock_actual} disabled />
          </Field>
          <p className="text-xs text-muted-foreground">
            El stock actual no es editable aquí — solo se modifica mediante un movimiento de inventario real
            (Entrada/Salida/Ajuste desde &quot;Registrar ingreso&quot; o Captura IA), nunca desde este formulario.
          </p>
        </>
      ) : (
        <>
          <Field label="Stock inicial">
            <Input type="number" value={0} disabled />
          </Field>
          <p className="text-xs text-muted-foreground">
            El producto siempre se crea con stock 0 — nunca se envía desde este formulario. Usa &quot;Registrar
            ingreso&quot; en su ficha para asignarle stock inicial mediante un movimiento de inventario real.
          </p>
        </>
      )}
    </CrudModal>
  );
}
