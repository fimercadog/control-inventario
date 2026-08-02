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
import { PermissionPicker } from "@/components/permission-picker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createRoleThunk, fetchCatalogoPermisos } from "@/store/slices/roles-slice";
import type { Role } from "@/lib/api/types";

/** Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md). */
export function NewRoleDialog({ onCreated }: { onCreated?: (role: Role) => void }) {
  const dispatch = useAppDispatch();
  const { catalogoPermisos, catalogoLoading } = useAppSelector((state) => state.roles);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [permisos, setPermisos] = useState<string[]>([]);

  useEffect(() => {
    if (open && catalogoPermisos.length === 0) {
      dispatch(fetchCatalogoPermisos());
    }
  }, [open, catalogoPermisos.length, dispatch]);

  async function save() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const creado = await dispatch(createRoleThunk({ name, permisos })).unwrap();
      toast.success("Rol creado correctamente");
      setOpen(false);
      setName("");
      setPermisos([]);
      onCreated?.(creado);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "No pudimos crear el rol.");
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
            Nuevo Rol
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Rol</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Permisos</Label>
            <PermissionPicker
              catalogo={catalogoPermisos}
              seleccionados={permisos}
              onChange={setPermisos}
              loading={catalogoLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button className="gap-2" onClick={save} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Creando..." : "Crear rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
