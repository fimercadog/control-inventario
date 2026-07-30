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
import { createUnidadMedida } from "@/lib/api/unidades-medida";
import type { StoreUnidadMedidaPayload, UnidadMedida } from "@/lib/api/types";

const EMPTY_FORM: StoreUnidadMedidaPayload = {
  nombre: "",
  abreviatura: "",
};

/** RC1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). */
export function NewUnidadMedidaDialog({
  onCreated,
}: {
  onCreated?: (unidad: UnidadMedida) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StoreUnidadMedidaPayload>(EMPTY_FORM);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const creada = await createUnidadMedida(form);
      toast.success("Unidad de medida creada correctamente");
      setOpen(false);
      setForm(EMPTY_FORM);
      onCreated?.(creada);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos crear la unidad de medida.");
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
            Nueva Unidad de Medida
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Unidad de Medida</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Nombre *">
            <Input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              autoFocus
            />
          </Field>
          <Field label="Abreviatura">
            <Input
              value={form.abreviatura ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, abreviatura: e.target.value }))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Creando..." : "Crear unidad"}
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
