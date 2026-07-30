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
import { createCategoria } from "@/lib/api/categorias";
import type { Categoria, StoreCategoriaPayload } from "@/lib/api/types";

const EMPTY_FORM: StoreCategoriaPayload = {
  nombre: "",
  descripcion: "",
};

/** RC1 (docs/03_FUNCTIONAL_SPEC/Categories.md). */
export function NewCategoriaDialog({ onCreated }: { onCreated?: (categoria: Categoria) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StoreCategoriaPayload>(EMPTY_FORM);

  async function save() {
    if (!form.nombre?.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const creada = await createCategoria(form);
      toast.success("Categoría creada correctamente");
      setOpen(false);
      setForm(EMPTY_FORM);
      onCreated?.(creada);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos crear la categoría.");
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
            Nueva Categoría
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
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
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Creando..." : "Crear categoría"}
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
