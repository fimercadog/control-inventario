"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PackagePlus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MODAL_SIZES } from "@/components/ui/modal";
import { registrarIngreso } from "@/lib/api/productos";
import { listProveedores } from "@/lib/api/proveedores";
import type {
  Producto,
  ProductoProveedorAsociacion,
  Proveedor,
  RegistrarIngresoPayload,
} from "@/lib/api/types";

const EMPTY_FORM: RegistrarIngresoPayload = {
  cantidad: 0,
  costo: undefined,
  proveedor_id: undefined,
  proveedor_nuevo: undefined,
  documento: "",
  observacion: "",
  lote: "",
  vencimiento: "",
};

const NUEVO_PROVEEDOR_VALUE = "__nuevo__";

/**
 * FEATURE-002 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2). "Factura"
 * se envía como `documento` — mismo campo que ya usa Captura IA.
 * `lote`/`vencimiento` son descriptivos, no implementan inventario por
 * lote real (ver la adenda).
 *
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md): el campo Proveedor
 * ahora es "seleccionar existente o crear uno rápido", no texto libre.
 *
 * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md): si el producto tiene
 * un proveedor principal asociado, se preselecciona por defecto — el
 * usuario puede cambiarlo a cualquier otro proveedor asociado o activo
 * antes de guardar. El backend (`ProductoController::resolverProveedor`)
 * aplica el mismo default de forma independiente, así que este
 * preselect es solo una comodidad de UI, no la única garantía.
 */
export function RegistrarIngresoDialog({
  productoId,
  proveedorPrincipal,
  onRegistered,
}: {
  productoId: number;
  proveedorPrincipal?: ProductoProveedorAsociacion;
  onRegistered: (producto: Producto) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RegistrarIngresoPayload>(EMPTY_FORM);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>(
    proveedorPrincipal ? String(proveedorPrincipal.proveedor_id) : ""
  );
  const [nombreProveedorNuevo, setNombreProveedorNuevo] = useState("");

  useEffect(() => {
    if (!open) return;
    listProveedores({ estado: "activo" })
      .then((result) => setProveedores(result.items))
      .catch(() => {
        // Si el listado de proveedores falla, el ingreso igual puede
        // registrarse sin proveedor — no bloquea el flujo principal.
      });
  }, [open]);

  async function save() {
    if (!form.cantidad || form.cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a cero.");
      return;
    }
    setSaving(true);
    try {
      const payload: RegistrarIngresoPayload = { ...form };
      if (proveedorSeleccionado === NUEVO_PROVEEDOR_VALUE) {
        payload.proveedor_nuevo = nombreProveedorNuevo || undefined;
        payload.proveedor_id = undefined;
      } else if (proveedorSeleccionado) {
        payload.proveedor_id = Number(proveedorSeleccionado);
        payload.proveedor_nuevo = undefined;
      }
      if (!payload.vencimiento) delete payload.vencimiento;
      const actualizado = await registrarIngreso(productoId, payload);
      onRegistered(actualizado);
      toast.success("Ingreso registrado correctamente");
      setOpen(false);
      setForm(EMPTY_FORM);
      setProveedorSeleccionado(proveedorPrincipal ? String(proveedorPrincipal.proveedor_id) : "");
      setNombreProveedorNuevo("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos registrar el ingreso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="gap-2">
            <PackagePlus className="size-4" />
            Registrar ingreso
          </Button>
        }
      />
      <DialogContent className={MODAL_SIZES.sm}>
        <DialogHeader>
          <DialogTitle>Registrar ingreso</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cantidad *">
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={form.cantidad || ""}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: Number(e.target.value) }))}
                autoFocus
              />
            </Field>
            <Field label="Costo">
              <Input
                type="number"
                min={0}
                value={form.costo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) }))}
              />
            </Field>
          </div>
          <Field label="Proveedor">
            <Select
              items={{
                "": "Sin proveedor",
                ...Object.fromEntries(proveedores.map((p) => [String(p.id), p.nombre])),
                [NUEVO_PROVEEDOR_VALUE]: "+ Crear proveedor nuevo",
              }}
              value={proveedorSeleccionado}
              onValueChange={(value) => setProveedorSeleccionado(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin proveedor</SelectItem>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
                <SelectItem value={NUEVO_PROVEEDOR_VALUE}>+ Crear proveedor nuevo</SelectItem>
              </SelectContent>
            </Select>
            {proveedorSeleccionado === NUEVO_PROVEEDOR_VALUE && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  placeholder="Razón social del nuevo proveedor"
                  value={nombreProveedorNuevo}
                  onChange={(e) => setNombreProveedorNuevo(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cancelar proveedor nuevo"
                  onClick={() => {
                    setProveedorSeleccionado("");
                    setNombreProveedorNuevo("");
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </Field>
          <Field label="Factura">
            <Input
              value={form.documento ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lote">
              <Input
                value={form.lote ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))}
              />
            </Field>
            <Field label="Vencimiento">
              <Input
                type="date"
                value={form.vencimiento ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, vencimiento: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Observaciones">
            <Input
              value={form.observacion ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Guardando..." : "Registrar ingreso"}
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
