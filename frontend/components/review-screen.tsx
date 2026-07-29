"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PackageSearch, Sparkles, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ReviewProductCard } from "@/components/review-product-card";
import { MovementTypeBadge } from "@/components/movement-type-badge";
import { getCapture, confirmCapture, discardCapture } from "@/lib/api/captura-ia";
import type { CapturaIA, DetectedProduct } from "@/lib/api/types";
import type { MovementType } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ESTADO_SUMMARY: Record<CapturaIA["estado"], { label: string; className: string }> = {
  procesando: { label: "Procesando", className: "bg-muted text-muted-foreground" },
  pendiente_revision: { label: "Necesita tu revisión", className: "bg-warning/20 text-amber-700 dark:text-amber-400" },
  parcial: { label: "Parcialmente aplicado", className: "bg-warning/20 text-amber-700 dark:text-amber-400" },
  aplicado: { label: "Aplicado a inventario", className: "bg-success/15 text-success" },
  descartado: { label: "Descartado", className: "bg-muted text-muted-foreground" },
};

export function ReviewScreen({ uuid }: { uuid: string }) {
  const [captura, setCaptura] = useState<CapturaIA | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"confirmar" | "descartar" | null>(null);

  useEffect(() => {
    getCapture(uuid)
      .then(setCaptura)
      .catch((error) => toast.error(error instanceof Error ? error.message : "No pudimos cargar la captura."))
      .finally(() => setLoading(false));
  }, [uuid]);

  function handleDetailSaved(updated: DetectedProduct) {
    setCaptura((prev) =>
      prev
        ? { ...prev, products: prev.products.map((p) => (p.id === updated.id ? updated : p)) }
        : prev
    );
  }

  async function handleConfirm() {
    setActionLoading("confirmar");
    try {
      const updated = await confirmCapture(uuid);
      setCaptura(updated);
      toast.success("Inventario actualizado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos confirmar la captura.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDiscard() {
    setActionLoading("descartar");
    try {
      const updated = await discardCapture(uuid);
      setCaptura(updated);
      toast("Captura descartada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos descartar la captura.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!captura) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <EmptyState
          icon={XCircle}
          title="No encontramos esta captura"
          description="Puede que ya haya sido procesada o que el enlace sea incorrecto."
          action={
            <Button render={<Link href="/captura" />} nativeButton={false}>
              Volver a Captura IA
            </Button>
          }
        />
      </div>
    );
  }

  const pendingCount = captura.products.filter(
    (p) => p.estado === "pendiente_revision" || p.estado === "corregido"
  ).length;
  const summary = ESTADO_SUMMARY[captura.estado];
  const isFinal = captura.estado === "aplicado" || captura.estado === "descartado";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Revisar captura</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${summary.className}`}>
              {summary.label}
            </span>
            <MovementTypeBadge tipo={captura.movement as MovementType} />
            <span>{formatRelativeTime(captura.created_at)}</span>
          </div>
        </div>
        {captura.transcripcion && (
          <Card className="max-w-xs border-border/60 bg-muted/40">
            <CardContent className="py-2.5 text-xs italic text-muted-foreground">
              &quot;{captura.transcripcion}&quot;
            </CardContent>
          </Card>
        )}
      </div>

      {captura.products.length === 0 ? (
        <Card className="border-border/60 py-0">
          <CardContent className="px-0">
            <EmptyState
              icon={PackageSearch}
              title="No detectamos ningún producto"
              description="Intenta con una foto más clara o describe el movimiento por voz."
            />
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
            !isFinal && "pb-24"
          )}
        >
          {captura.products.map((product) => (
            <ReviewProductCard
              key={product.id}
              captureId={uuid}
              product={product}
              onSaved={handleDetailSaved}
            />
          ))}
        </div>
      )}

      {isFinal ? (
        <Card className="border-border/60 bg-muted/30">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            {captura.estado === "aplicado" ? (
              <CheckCircle2 className="size-8 text-success" />
            ) : (
              <XCircle className="size-8 text-muted-foreground" />
            )}
            <p className="font-medium">
              {captura.estado === "aplicado"
                ? "Tu inventario ya quedó actualizado."
                : "Esta captura fue descartada, no afectó tu inventario."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" render={<Link href="/captura" />} nativeButton={false}>
                Nueva captura
              </Button>
              <Button render={<Link href="/dashboard" />} nativeButton={false}>Ir al dashboard</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} producto${pendingCount === 1 ? "" : "s"} esperando tu confirmación.`
              : "Todo listo para confirmar."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-11 gap-2"
              onClick={handleDiscard}
              disabled={actionLoading !== null}
            >
              {actionLoading === "descartar" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ThumbsDown className="size-4" />
              )}
              {actionLoading === "descartar" ? "Descartando..." : "Descartar"}
            </Button>
            <Button size="lg" className="h-11 gap-2" onClick={handleConfirm} disabled={actionLoading !== null}>
              {actionLoading === "confirmar" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ThumbsUp className="size-4" />
              )}
              {actionLoading === "confirmar" ? "Guardando..." : "Confirmar todo"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" render={<Link href="/captura" />} nativeButton={false}>
          <Sparkles className="size-3.5" />
          Nueva captura
        </Button>
      </div>
    </div>
  );
}
