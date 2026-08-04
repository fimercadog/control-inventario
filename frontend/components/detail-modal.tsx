"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MODAL_SCROLL_CLASS, MODAL_SIZES, type ModalSize } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

/**
 * Global UI Standard (2026-08-03): View siempre en modal de solo
 * lectura, nunca en página completa. `tabs` reutiliza exactamente el
 * mismo patrón "Detalle + relacionados de solo lectura" que ya tenían
 * las fichas de página completa (Categorías/Marcas/Unidades/
 * Proveedores/Productos/Roles) — si no se pasa `tabs`, `children` se
 * renderiza directo (módulos sin pestañas, ej. Clientes). Tamaño y
 * comportamiento de scroll vienen de `components/ui/modal.ts` — este
 * componente no define los suyos propios (Design System, ver
 * docs/11_DESIGN_SYSTEM/DESIGN_SYSTEM.md).
 */
export function DetailModal({
  open,
  onOpenChange,
  icon: Icon,
  title,
  badge,
  headerActions,
  loading = false,
  size = "md",
  tabs,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  loading?: boolean;
  size?: ModalSize;
  tabs?: { value: string; label: string; content: React.ReactNode }[];
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(MODAL_SIZES[size], MODAL_SCROLL_CLASS)}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando...
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <DialogTitle>{title}</DialogTitle>
                    {badge}
                  </div>
                </div>
                {headerActions && <div className="flex shrink-0 items-center gap-2">{headerActions}</div>}
              </div>
            </DialogHeader>

            {tabs ? (
              <Tabs defaultValue={tabs[0]?.value}>
                <TabsList>
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {tabs.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value}>
                    {tab.content}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              children
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function InfoRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-medium" : undefined}>{value}</span>
    </div>
  );
}
