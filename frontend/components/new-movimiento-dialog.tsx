"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMovimiento } from "@/lib/api/movimientos";
import { listProductos } from "@/lib/api/productos";
import { listProveedores } from "@/lib/api/proveedores";
import type { Movimiento, Producto, Proveedor, StoreMovimientoPayload } from "@/lib/api/types";

const TIPOS: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
};

const DIRECCIONES: Record<string, string> = {
  incremento: "Incremento (encontró más stock)",
  decremento: "Decremento (encontró menos stock)",
};

const EMPTY_FORM: Partial<StoreMovimientoPayload> = {
  tipo: "entrada",
};

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Único mecanismo de
 * "Crear" del módulo global de Movimientos. `direccion` solo se muestra
 * para Ajuste (el único tipo bidireccional); `proveedor` solo se muestra
 * para Entrada. Gap conocido y documentado: el selector de Producto
 * carga hasta 100 productos activos (mismo límite que el resto de los
 * selectores de este proyecto, p. ej. Proveedor en la Ficha de
 * Producto) — el backend de Productos todavía no expone búsqueda
 * server-side (`busqueda`), así que un catálogo con más de 100 productos
 * no es totalmente navegable desde aquí todavía.
 */
export function NewMovimientoDialog({ onCreated }: { onCreated?: (movimiento: Movimiento) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [form, setForm] = useState<Partial<StoreMovimientoPayload>>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    listProductos({ estado: "activo" })
      .then((result) => setProductos(result.items))
      .catch(() => {
        // El diálogo sigue siendo usable con la lista vacía; reabrir reintenta la carga.
      });
    listProveedores({ estado: "activo" })
      .then((result) => setProveedores(result.items))
      .catch(() => {});
  }, [open]);

  const productoSeleccionado = productos.find((p) => p.id === form.producto_id);
  const esSalidaDeStock =
    form.tipo === "salida" || (form.tipo === "ajuste" && form.direccion === "decremento");
  const excedeStockDisponible =
    esSalidaDeStock &&
    productoSeleccionado !== undefined &&
    (form.cantidad ?? 0) > productoSeleccionado.stock_actual;

  async function save() {
    if (!form.producto_id) {
      toast.error("Selecciona un producto.");
      return;
    }
    if (!form.cantidad || form.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0.");
      return;
    }
    if (form.tipo === "ajuste" && !form.direccion) {
      toast.error("Selecciona si el ajuste incrementa o decrementa el stock.");
      return;
    }
    if (excedeStockDisponible && productoSeleccionado) {
      toast.error(
        `Stock insuficiente. Disponible: ${productoSeleccionado.stock_actual}. Solicitado: ${form.cantidad}.`
      );
      return;
    }

    setSaving(true);
    try {
      const payload: StoreMovimientoPayload = {
        producto_id: form.producto_id,
        tipo: form.tipo as StoreMovimientoPayload["tipo"],
        cantidad: form.cantidad,
        ...(form.tipo === "ajuste" ? { direccion: form.direccion } : {}),
        ...(form.tipo === "entrada" && form.proveedor_id ? { proveedor_id: form.proveedor_id } : {}),
        documento: form.documento,
        observacion: form.observacion,
      };
      const creado = await createMovimiento(payload);
      toast.success("Movimiento registrado correctamente");
      setOpen(false);
      setForm(EMPTY_FORM);
      onCreated?.(creado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos registrar el movimiento.");
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
            Nuevo Movimiento
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Tipo *">
            <Select
              items={TIPOS}
              value={form.tipo}
              onValueChange={(value) => setForm((f) => ({ ...f, tipo: value as StoreMovimientoPayload["tipo"] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Producto *">
            <Select
              items={Object.fromEntries(productos.map((p) => [String(p.id), `${p.nombre} (${p.codigo ?? "s/código"})`]))}
              value={form.producto_id ? String(form.producto_id) : undefined}
              onValueChange={(value) => setForm((f) => ({ ...f, producto_id: value ? Number(value) : undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((producto) => (
                  <SelectItem key={producto.id} value={String(producto.id)}>
                    {producto.nombre} ({producto.codigo ?? "s/código"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Cantidad *">
            <Input
              type="number"
              min={0.01}
              step="0.01"
              aria-invalid={excedeStockDisponible}
              className={excedeStockDisponible ? "border-destructive" : undefined}
              value={form.cantidad ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, cantidad: Number(e.target.value) }))}
            />
            {esSalidaDeStock && productoSeleccionado && (
              <p className={excedeStockDisponible ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                {excedeStockDisponible
                  ? `Stock insuficiente. Disponible: ${productoSeleccionado.stock_actual}.`
                  : `Disponible: ${productoSeleccionado.stock_actual}`}
              </p>
            )}
          </Field>

          {form.tipo === "ajuste" && (
            <Field label="Dirección del ajuste *">
              <Select
                items={DIRECCIONES}
                value={form.direccion}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, direccion: value as StoreMovimientoPayload["direccion"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="¿Incrementa o decrementa?" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DIRECCIONES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {form.tipo === "entrada" && (
            <Field label="Proveedor">
              <Select
                items={Object.fromEntries(proveedores.map((p) => [String(p.id), p.nombre]))}
                value={form.proveedor_id ? String(form.proveedor_id) : undefined}
                onValueChange={(value) => setForm((f) => ({ ...f, proveedor_id: value ? Number(value) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={String(proveedor.id)}>
                      {proveedor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Documento">
            <Input
              value={form.documento ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
            />
          </Field>
          <Field label="Observación">
            <Input
              value={form.observacion ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving || excedeStockDisponible}>
            <Save className="size-4" />
            {saving ? "Registrando..." : "Registrar movimiento"}
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
