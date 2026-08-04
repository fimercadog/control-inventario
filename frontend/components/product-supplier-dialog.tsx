"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { asociarProveedor, actualizarAsociacionProveedor } from "@/lib/api/productos";
import { listProveedores } from "@/lib/api/proveedores";
import type { ProductoProveedorAsociacion, Proveedor } from "@/lib/api/types";

/**
 * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Un solo componente
 * para asociar un proveedor nuevo a un producto (modo "crear", sin
 * `asociacion`) o editar una asociación existente (modo "editar",
 * `asociacion` provisto) — mismo patrón de reutilización que
 * RegistrarIngresoDialog/NewSupplierDialog.
 */
export function ProductSupplierDialog({
  productoId,
  asociacion,
  proveedoresYaAsociados,
  onSaved,
}: {
  productoId: number;
  asociacion?: ProductoProveedorAsociacion;
  proveedoresYaAsociados: number[];
  onSaved: (asociacion: ProductoProveedorAsociacion) => void;
}) {
  const editando = Boolean(asociacion);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorId, setProveedorId] = useState<string>(
    asociacion ? String(asociacion.proveedor_id) : ""
  );
  const [esPrincipal, setEsPrincipal] = useState(asociacion?.es_principal ?? false);
  const [precioCompra, setPrecioCompra] = useState<string>(
    asociacion?.precio_compra != null ? String(asociacion.precio_compra) : ""
  );
  const [codigoProveedor, setCodigoProveedor] = useState(asociacion?.codigo_proveedor ?? "");

  useEffect(() => {
    if (!open) return;
    listProveedores({ estado: "activo" })
      .then((result) => setProveedores(result.items))
      .catch(() => {
        // El diálogo sigue siendo usable con la lista vacía; reabrir reintenta la carga.
      });
  }, [open]);

  // Un proveedor ya asociado (activo) no puede volver a asociarse — la
  // tabla `producto_proveedor` tiene un unique(producto_id, proveedor_id).
  const opcionesProveedor = editando
    ? proveedores
    : proveedores.filter((p) => !proveedoresYaAsociados.includes(p.id));

  async function save() {
    if (!editando && !proveedorId) {
      toast.error("Selecciona un proveedor.");
      return;
    }
    setSaving(true);
    try {
      const cambios = {
        es_principal: esPrincipal,
        precio_compra: precioCompra === "" ? null : Number(precioCompra),
        codigo_proveedor: codigoProveedor || null,
      };
      const resultado =
        editando && asociacion
          ? await actualizarAsociacionProveedor(productoId, asociacion.id, cambios)
          : await asociarProveedor(productoId, { proveedor_id: Number(proveedorId), ...cambios });
      toast.success(editando ? "Asociación actualizada correctamente" : "Proveedor asociado correctamente");
      setOpen(false);
      onSaved(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar la asociación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          editando ? (
            <Button size="icon-sm" variant="ghost" aria-label="Editar asociación">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="size-4" />
              Asociar proveedor
            </Button>
          )
        }
      />
      <DialogContent className={MODAL_SIZES.sm}>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar asociación" : "Asociar proveedor"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Proveedor *">
            {editando ? (
              <Input value={asociacion?.proveedor_nombre ?? ""} disabled />
            ) : (
              <Select
                items={Object.fromEntries(opcionesProveedor.map((p) => [String(p.id), p.nombre]))}
                value={proveedorId}
                onValueChange={(value) => setProveedorId(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {opcionesProveedor.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio de compra">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
              />
            </Field>
            <Field label="Código del proveedor">
              <Input value={codigoProveedor} onChange={(e) => setCodigoProveedor(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={esPrincipal}
              onCheckedChange={(checked) => setEsPrincipal(checked === true)}
            />
            Proveedor principal
          </label>
          <p className="text-xs text-muted-foreground">
            Solo puede haber un proveedor principal activo por producto — marcar este desmarca
            automáticamente cualquier otro. El ingreso manual usa el proveedor principal por
            defecto.
          </p>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Guardando..." : "Guardar"}
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
