"use client";

import { Loader2, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODAL_SCROLL_CLASS, MODAL_SIZES, type ModalSize } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

/**
 * Global UI Standard (2026-08-03): Create/Edit siempre en modal, nunca
 * en página completa — la tabla permanece visible detrás. Shell
 * compartido entre los 8 módulos CRUD: cada uno sigue dueño de sus
 * propios campos (children), esto solo estandariza apertura/cierre,
 * título, footer Cancelar/Guardar y el estado de guardado. Tamaño y
 * comportamiento de scroll vienen de `components/ui/modal.ts` — este
 * componente no define los suyos propios (Design System, ver
 * docs/11_DESIGN_SYSTEM/DESIGN_SYSTEM.md).
 */
export function CrudModal({
  open,
  onOpenChange,
  title,
  description,
  size = "sm",
  onSubmit,
  submitLabel,
  savingLabel = "Guardando...",
  saving = false,
  submitDisabled = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: ModalSize;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  savingLabel?: string;
  saving?: boolean;
  submitDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className={cn(MODAL_SIZES[size], MODAL_SCROLL_CLASS)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-3">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={onSubmit} disabled={saving || submitDisabled}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? savingLabel : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * `locked` (ADR-015, modelo de identidad ERP, 2026-08-04): campo de
 * identidad deshabilitado en modo edición — nunca oculto (el usuario debe
 * poder ver el valor). Muestra un ícono de candado junto a la etiqueta y
 * una leyenda corta debajo, para que la razón sea obvia sin depender de
 * que el usuario intente escribir y no pase nada.
 */
export function Field({
  label,
  locked = false,
  children,
}: {
  label: string;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {locked && <Lock className="size-3" aria-hidden="true" />}
      </Label>
      {children}
      {locked && (
        <p className="text-xs text-muted-foreground">Campo de identidad. No se puede modificar después de crear el registro.</p>
      )}
    </div>
  );
}
