"use client";

import { useState } from "react";
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
import { createProveedor } from "@/lib/api/proveedores";
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

/** FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). */
export function NewSupplierDialog({ onCreated }: { onCreated?: (proveedor: Proveedor) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StoreProveedorPayload>(EMPTY_FORM);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("La razón social es obligatoria.");
      return;
    }
    setSaving(true);
    try {
      const creado = await createProveedor(form);
      toast.success("Proveedor creado correctamente");
      setOpen(false);
      setForm(EMPTY_FORM);
      onCreated?.(creado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos crear el proveedor.");
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
            Nuevo Proveedor
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Proveedor</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
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
              <Input
                value={form.contacto ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono">
              <Input
                value={form.telefono ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
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
            <Input
              value={form.direccion ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
            />
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
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Creando..." : "Crear proveedor"}
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
