"use client";

import { Loader2, Save } from "lucide-react";
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
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
} as const;

/**
 * Global UI Standard (2026-08-03): Create/Edit siempre en modal, nunca
 * en página completa — la tabla permanece visible detrás. Shell
 * compartido entre los 8 módulos CRUD: cada uno sigue dueño de sus
 * propios campos (children), esto solo estandariza apertura/cierre,
 * título, footer Cancelar/Guardar y el estado de guardado.
 */
export function CrudModal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
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
  size?: keyof typeof SIZES;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  savingLabel?: string;
  saving?: boolean;
  submitDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className={cn(SIZES[size], "max-h-[85vh] overflow-y-auto")}>
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

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
