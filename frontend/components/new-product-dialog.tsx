"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProducto } from "@/lib/api/productos";
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
 * FEATURE-001 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2). Al guardar,
 * redirige a la ficha del producto recién creado — el mismo destino que
 * cualquier otro origen de navegación hacia un producto (Adenda 1,
 * navegación unificada).
 *
 * Corrección de auditoría funcional (docs/06_TESTS/DemoDataAudit.md,
 * 2026-07-30): el campo Stock se muestra siempre deshabilitado en 0 —
 * nunca se envía desde el frontend, el backend lo asigna automáticamente
 * (ProductService::crear(), stock_actual fuera de $fillable). El único
 * proceso autorizado para modificar stock es un movimiento de inventario
 * (Entrada/Salida/Ajuste), nunca este formulario.
 */
export function NewProductDialog({ onCreated }: { onCreated?: (producto: Producto) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StoreProductoPayload>(EMPTY_FORM);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const creado = await createProducto(form);
      toast.success("Producto creado correctamente");
      setOpen(false);
      setForm(EMPTY_FORM);
      onCreated?.(creado);
      router.push(`/productos/${creado.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos crear el producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Nuevo Producto
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Nombre *">
            <Input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código">
              <Input
                value={form.codigo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              />
            </Field>
            <Field label="Marca">
              <Input
                value={form.marca_nuevo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, marca_nuevo: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Presentación">
            <Input
              value={form.presentacion ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, presentacion: e.target.value }))}
            />
          </Field>
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
          <Field label="Stock inicial">
            <Input type="number" value={0} disabled />
          </Field>
          <p className="text-xs text-muted-foreground">
            El producto siempre se crea con stock 0 — nunca se envía desde este formulario. Usa
            &quot;Registrar ingreso&quot; en su ficha para asignarle stock inicial mediante un
            movimiento de inventario real.
          </p>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Creando..." : "Crear producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
