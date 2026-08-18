"use client";

import Link from "next/link";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { activarContingencia } from "@/lib/contingencia/store";
import { useContingencia } from "@/hooks/use-contingencia";
import { useAppSelector } from "@/store/hooks";
import { can } from "@/lib/permissions/can";

export function ContingenciaControls() {
  const [open, setOpen] = useState(false);
  const { activo } = useContingencia();
  const permissions = useAppSelector((state) => state.session.user?.permissions ?? []);
  if (!can(permissions, "productos.crear") && !can(permissions, "productos.editar")) return null;

  if (activo) {
    return (
      <Button
        nativeButton={false}
        render={<Link href="/contingencia" />}
        variant="destructive"
        className="w-full justify-start border border-destructive/40 bg-destructive-container text-destructive-container-foreground hover:bg-destructive-container/80"
      >
        <TriangleAlert />Contingencia activa
      </Button>
    );
  }
  return <>
    <Button variant="outline" className="w-full justify-start border-sidebar-warning/50 text-sidebar-warning hover:bg-sidebar-warning/15 hover:text-sidebar-warning" onClick={() => setOpen(true)}><TriangleAlert />Modo Contingencia</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Activar Modo Contingencia</DialogTitle><DialogDescription>El Modo Contingencia permite continuar trabajando con Productos cuando la conexión con el servidor no está disponible o es inestable. Mientras permanezca activo, las operaciones normales de escritura del resto del sistema estarán bloqueadas.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button variant="destructive" onClick={() => { activarContingencia(); setOpen(false); }}>Activar Contingencia</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
