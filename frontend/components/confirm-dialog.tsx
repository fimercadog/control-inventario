"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmación reutilizable para acciones de Logical Delete/Activar-Desactivar
 * (Global UI Standard, aprobado 2026-07-29: "1. Ask for confirmation").
 * Controlado por el padre (sin trigger propio) para poder abrirse desde un
 * ítem de un DropdownMenu sin los problemas de foco/portal de anidar un
 * Dialog directamente dentro de un DropdownMenuItem.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [confirmando, setConfirmando] = useState(false);

  async function confirmar() {
    setConfirmando(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirmando}>
            Cancelar
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={confirmar} disabled={confirmando}>
            {confirmando ? "Procesando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
