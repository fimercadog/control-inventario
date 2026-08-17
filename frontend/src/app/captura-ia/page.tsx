"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Loader2, Mic, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/hooks/use-permission";
import { capturarPorFoto, capturarPorVoz, capturarPorFotoVoz, fetchCapturasIA } from "@/lib/api/captura-ia";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { CapturaIAEntry } from "@/types/captura-ia";

type Modo = "foto" | "voz" | "foto_voz";

const MAX_IMAGEN_BYTES = 10240 * 1024; // matches StoreFotoRequest: image, max:10240 (KB)
const MAX_AUDIO_BYTES = 20480 * 1024; // matches StoreVozRequest: file, max:20480 (KB)

const ESTADO_BADGE: Record<string, string> = {
  aplicado: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  pendiente_revision: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  parcial: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  descartado: "border-slate-400/40 bg-slate-400/15 text-slate-300",
  procesando: "border-slate-400/40 bg-slate-400/15 text-slate-300",
};
const ESTADO_LABEL: Record<string, string> = {
  aplicado: "Aplicado",
  pendiente_revision: "Pendiente de revisión",
  parcial: "Parcial",
  descartado: "Descartado",
  procesando: "Procesando",
};

export default function CapturaIAPage() {
  const router = useRouter();
  const canUsar = usePermission("captura-ia.usar");

  const [modo, setModo] = useState<Modo>("foto");
  const [imagen, setImagen] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analizando">("idle");
  const [error, setError] = useState<string | null>(null);
  const [recientes, setRecientes] = useState<CapturaIAEntry[] | null>(null);
  const imagenInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canUsar) return;
    fetchCapturasIA(1).then((d) => setRecientes(d.items)).catch(() => setRecientes([]));
  }, [canUsar]);

  function handleImagenChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_IMAGEN_BYTES) {
      setError("La imagen no puede superar 10MB.");
      return;
    }
    setError(null);
    setImagen(file);
  }

  function handleAudioChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AUDIO_BYTES) {
      setError("El audio no puede superar 20MB.");
      return;
    }
    setError(null);
    setAudio(file);
  }

  async function handleAnalizar() {
    setStatus("analizando");
    setError(null);
    try {
      const captura =
        modo === "foto" && imagen
          ? await capturarPorFoto(imagen)
          : modo === "voz" && audio
            ? await capturarPorVoz(audio)
            : modo === "foto_voz" && imagen && audio
              ? await capturarPorFotoVoz(imagen, audio)
              : null;
      if (!captura) {
        setError("Selecciona los archivos requeridos para este modo.");
        setStatus("idle");
        return;
      }
      router.push(`/captura-ia/${captura.id}`);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No pudimos analizar la captura."));
      setStatus("idle");
    }
  }

  const puedeAnalizar =
    status === "idle" &&
    ((modo === "foto" && imagen !== null) ||
      (modo === "voz" && audio !== null) ||
      (modo === "foto_voz" && imagen !== null && audio !== null));

  if (!canUsar) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>No tienes permiso para ver este módulo.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Captura IA</h1>
        <p className="text-sm text-muted-foreground">
          Da de alta inventario mostrando una foto o hablando — la IA propone, tú confirmas.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={modo === "foto" ? "default" : "outline"} onClick={() => setModo("foto")}>
          <Camera className="size-4" />
          Foto
        </Button>
        <Button variant={modo === "voz" ? "default" : "outline"} onClick={() => setModo("voz")}>
          <Mic className="size-4" />
          Voz
        </Button>
        <Button variant={modo === "foto_voz" ? "default" : "outline"} onClick={() => setModo("foto_voz")}>
          <Video className="size-4" />
          Foto + Voz
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {modo === "foto" || modo === "foto_voz" ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Imagen</label>
              <input
                ref={imagenInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImagenChange}
                className="text-sm text-muted-foreground"
                aria-label="Seleccionar imagen"
              />
              {imagen ? <p className="text-xs text-muted-foreground">{imagen.name}</p> : null}
            </div>
          ) : null}

          {modo === "voz" || modo === "foto_voz" ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Audio</label>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="text-sm text-muted-foreground"
                aria-label="Seleccionar audio"
              />
              {audio ? <p className="text-xs text-muted-foreground">{audio.name}</p> : null}
            </div>
          ) : null}

          <Button disabled={!puedeAnalizar} onClick={handleAnalizar} className="w-fit">
            {status === "analizando" ? <Loader2 className="size-4 animate-spin" /> : null}
            Analizar
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Capturas recientes</h2>
        {recientes === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : recientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no has hecho ninguna captura.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recientes.map((captura) => (
              <li key={captura.id}>
                <Link
                  href={`/captura-ia/${captura.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {captura.tipo === "foto" ? "Foto" : captura.tipo === "voz" ? "Voz" : "Foto + Voz"} ·{" "}
                      {captura.products.length} producto(s)
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(captura.created_at)}</p>
                  </div>
                  <Badge className={ESTADO_BADGE[captura.estado]}>{ESTADO_LABEL[captura.estado]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
