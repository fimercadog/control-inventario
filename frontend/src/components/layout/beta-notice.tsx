"use client";

import { ChevronDown, CircleAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** A persistent, app-wide explanation of the product's beta status. */
export function BetaNotice({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={iconOnly
              ? "flex h-8 items-center gap-0.5 rounded-lg px-1.5 text-amber-600 transition-colors hover:bg-amber-500/12 hover:text-amber-700 dark:text-amber-300 dark:hover:bg-amber-400/10"
              : compact
              ? "flex w-full items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-amber-700 transition-colors hover:bg-amber-500/15 dark:text-amber-300"
              : "flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-amber-200 transition-colors hover:bg-white/10"}
            aria-label="Ver información de la versión beta"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <CircleAlert className="size-4 shrink-0" />
          {iconOnly ? null : <>
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold">Versión beta</span>
            {!compact ? <span className="truncate text-[11px] text-slate-400">Conoce las novedades</span> : null}
          </span>
          </>}
        </span>
        <ChevronDown className={iconOnly ? "size-3.5 shrink-0 opacity-75" : "size-4 shrink-0 opacity-80"} />
      </DialogTrigger>

      <DialogContent className="gap-5 p-0 sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="gap-3 p-5 pb-0 pr-12">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary"><Sparkles className="size-5" /></div>
          <DialogTitle>Estás usando FidelOS Beta</DialogTitle>
          <DialogDescription>
            Esta versión está en evolución. Tus movimientos y datos siguen guardándose normalmente, mientras afinamos la experiencia contigo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-5 text-sm">
          <div className="rounded-xl border border-border/80 bg-muted/45 p-3"><p className="font-medium text-foreground">Antes de confirmar</p><p className="mt-1 text-muted-foreground">Revisa cantidades, productos y movimientos para mantener el inventario preciso.</p></div>
          <div className="rounded-xl border border-border/80 bg-muted/45 p-3"><p className="font-medium text-foreground">Tus comentarios ayudan</p><p className="mt-1 text-muted-foreground">Si encuentras algo inesperado, repórtalo para poder mejorarlo en la siguiente actualización.</p></div>
        </div>
        <div className="flex items-center justify-between border-t border-border/80 px-5 py-4">
          <span className="text-xs text-muted-foreground">Beta · Actualizaciones activas</span>
          <DialogClose render={<Button />}>Entendido</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
