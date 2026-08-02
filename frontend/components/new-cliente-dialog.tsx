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
import { useAppDispatch } from "@/store/hooks";
import { createClienteThunk } from "@/store/slices/clientes-slice";
import type { Cliente, StoreClientePayload } from "@/lib/api/types";

const EMPTY_FORM: StoreClientePayload = {
  nombre: "",
  nit: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
  ciudad: "",
  pais: "",
};

/** Módulo Clientes (2026-08-02, docs/03_FUNCTIONAL_SPEC/Customers.md). */
export function NewClienteDialog({ onCreated }: { onCreated?: (cliente: Cliente) => void }) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StoreClientePayload>(EMPTY_FORM);

  function setField<K extends keyof StoreClientePayload>(key: K, value: StoreClientePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const creado = await dispatch(createClienteThunk(form)).unwrap();
      toast.success("Cliente creado correctamente");
      setOpen(false);
      setForm(EMPTY_FORM);
      onCreated?.(creado);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos crear el cliente.");
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
            Nuevo Cliente
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nombre *" className="sm:col-span-2">
            <Input value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} autoFocus />
          </Field>
          <Field label="NIT">
            <Input value={form.nit ?? ""} onChange={(e) => setField("nit", e.target.value)} />
          </Field>
          <Field label="Contacto">
            <Input value={form.contacto ?? ""} onChange={(e) => setField("contacto", e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.telefono ?? ""} onChange={(e) => setField("telefono", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setField("email", e.target.value)}
            />
          </Field>
          <Field label="Ciudad">
            <Input value={form.ciudad ?? ""} onChange={(e) => setField("ciudad", e.target.value)} />
          </Field>
          <Field label="País">
            <Input value={form.pais ?? ""} onChange={(e) => setField("pais", e.target.value)} />
          </Field>
          <Field label="Dirección" className="sm:col-span-2">
            <Input value={form.direccion ?? ""} onChange={(e) => setField("direccion", e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Creando..." : "Crear cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
