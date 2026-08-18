"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermission } from "@/hooks/use-permission";
import { fetchCapturaIA, confirmarCapturaIA, descartarCapturaIA, corregirDetalleIA } from "@/lib/api/captura-ia";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import { ESTADOS_EDITABLES } from "@/types/captura-ia";
import type { CapturaIADetalle, CapturaIAEntry } from "@/types/captura-ia";

const ESTADO_LABEL: Record<string, string> = {
  aplicado: "Aplicado",
  pendiente_revision: "Pendiente de revisión",
  parcial: "Parcial",
  descartado: "Descartado",
  procesando: "Procesando",
};

export default function CapturaIADetallePage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const canRevisar = usePermission("captura-ia.revisar");
  const canConfirmar = usePermission("captura-ia.confirmar");

  const [captura, setCaptura] = useState<CapturaIAEntry | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<"idle" | "confirmando" | "descartando">("idle");
  const [editingDetalle, setEditingDetalle] = useState<CapturaIADetalle | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchCapturaIA(uuid)
      .then((data) => {
        if (ignore) return;
        setCaptura(data);
        setError(null);
        setLoadedFor(uuid);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar la captura."));
        setLoadedFor(uuid);
      });
    return () => {
      ignore = true;
    };
  }, [uuid]);

  function reload() {
    fetchCapturaIA(uuid).then(setCaptura).catch(() => {});
  }

  async function handleConfirmar() {
    setActionStatus("confirmando");
    setError(null);
    try {
      const updated = await confirmarCapturaIA(uuid);
      setCaptura(updated);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo confirmar la captura."));
    } finally {
      setActionStatus("idle");
    }
  }

  async function handleDescartar() {
    setActionStatus("descartando");
    setError(null);
    try {
      const updated = await descartarCapturaIA(uuid);
      setCaptura(updated);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo descartar la captura."));
    } finally {
      setActionStatus("idle");
    }
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (captura === null || loadedFor !== uuid) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }

  const hayEditables = captura.products.some((p) => ESTADOS_EDITABLES.includes(p.estado));
  const puedeConfirmar = canConfirmar && hayEditables && captura.estado !== "descartado";
  const puedeDescartar = canConfirmar && hayEditables && captura.estado !== "descartado";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/captura-ia" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver a Captura IA
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Captura {captura.tipo === "foto" ? "por Foto" : captura.tipo === "voz" ? "por Voz" : "Foto + Voz"}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(captura.created_at)}</p>
        </div>
        <Badge>{ESTADO_LABEL[captura.estado]}</Badge>
      </div>

      {captura.estado === "pendiente_revision" || captura.estado === "parcial" ? (
        <Alert>
          <AlertDescription>
            Revisa y corrige lo necesario antes de confirmar — la IA propone, tú decides. Nunca
            asumas que una captura se aplicó sin revisar el resultado.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {captura.transcripcion ? (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transcripción</p>
          <p className="text-sm text-foreground">{captura.transcripcion}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Confianza promedio" value={`${Math.round(captura.confianza_promedio * 100)}%`} />
        <Field label="Movimiento detectado" value={captura.movement ?? "—"} />
        <Field label="Proveedor de IA" value={captura.proveedor ?? "—"} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Productos detectados</h2>
        {captura.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No se detectó ningún producto.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {captura.products.map((detalle) => (
              <li key={detalle.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {detalle.name}
                    {detalle.es_producto_nuevo ? (
                      <Badge variant="secondary" className="ml-2">Producto nuevo</Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[detalle.brand, detalle.presentation, detalle.category].filter(Boolean).join(" · ")}
                    {" · "}
                    {detalle.quantity} {detalle.unit ?? ""} · confianza {Math.round(detalle.confidence * 100)}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      detalle.estado === "aplicado"
                        ? "success"
                        : detalle.estado === "descartado"
                          ? "outline"
                          : "warning"
                    }
                  >
                    {ESTADO_LABEL[detalle.estado] ?? detalle.estado}
                  </Badge>
                  {canRevisar && ESTADOS_EDITABLES.includes(detalle.estado) ? (
                    <Button variant="outline" size="sm" onClick={() => setEditingDetalle(detalle)}>
                      <Pencil className="size-4" />
                      Corregir
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {puedeConfirmar || puedeDescartar ? (
        <div className="flex gap-2">
          {puedeConfirmar ? (
            <Button disabled={actionStatus !== "idle"} onClick={handleConfirmar}>
              {actionStatus === "confirmando" ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmar
            </Button>
          ) : null}
          {puedeDescartar ? (
            <Button variant="destructive" disabled={actionStatus !== "idle"} onClick={handleDescartar}>
              {actionStatus === "descartando" ? <Loader2 className="size-4 animate-spin" /> : null}
              Descartar
            </Button>
          ) : null}
        </div>
      ) : null}

      <CorregirDetalleDialog
        uuid={uuid}
        detalle={editingDetalle}
        onClose={() => setEditingDetalle(null)}
        onSaved={() => {
          setEditingDetalle(null);
          reload();
        }}
      />
    </div>
  );
}

function CorregirDetalleDialog({
  uuid,
  detalle,
  onClose,
  onSaved,
}: {
  uuid: string;
  detalle: CapturaIADetalle | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={detalle !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corregir producto detectado</DialogTitle>
        </DialogHeader>
        {detalle ? <CorregirDetalleForm key={detalle.id} uuid={uuid} detalle={detalle} onSaved={onSaved} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CorregirDetalleForm({ uuid, detalle, onSaved }: { uuid: string; detalle: CapturaIADetalle; onSaved: () => void }) {
  const [nombre, setNombre] = useState(detalle.name);
  const [marca, setMarca] = useState(detalle.brand ?? "");
  const [categoria, setCategoria] = useState(detalle.category ?? "");
  const [presentacion, setPresentacion] = useState(detalle.presentation ?? "");
  const [unidad, setUnidad] = useState(detalle.unit ?? "");
  const [cantidad, setCantidad] = useState(String(detalle.quantity));
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      await corregirDetalleIA(uuid, detalle.id, {
        nombre_detectado: nombre,
        marca_detectado: marca || null,
        categoria_detectado: categoria || null,
        presentacion_detectado: presentacion || null,
        unidad_detectado: unidad || null,
        cantidad_detectada: Number(cantidad),
      });
      onSaved();
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar la corrección."));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="detalle-nombre">Nombre</Label>
        <Input id="detalle-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="detalle-marca">Marca</Label>
          <Input id="detalle-marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detalle-categoria">Categoría</Label>
          <Input id="detalle-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detalle-presentacion">Presentación</Label>
          <Input id="detalle-presentacion" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detalle-unidad">Unidad</Label>
          <Input id="detalle-unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="detalle-cantidad">Cantidad</Label>
        <Input id="detalle-cantidad" type="number" step="0.01" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      </div>
      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar corrección
      </Button>
    </form>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
