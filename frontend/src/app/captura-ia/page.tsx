"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Loader2, Mic, Sparkles, Upload, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermission } from "@/hooks/use-permission";
import { capturarPorFoto, capturarPorVoz, capturarPorFotoVoz, fetchCapturasIA } from "@/lib/api/captura-ia";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { CapturaIAEntry } from "@/types/captura-ia";

type Modo = "foto" | "voz" | "foto_voz";

const MAX_IMAGEN_BYTES = 10240 * 1024; // matches StoreFotoRequest: image, max:10240 (KB)
const MAX_AUDIO_BYTES = 20480 * 1024; // matches StoreVozRequest: file, max:20480 (KB)
// La pantalla se publica como vista previa mientras se configura el proveedor
// de IA. Cambiar esta bandera a false habilita el flujo ya implementado.
const CAPTURA_IA_EN_PREPARACION = true;

const ESTADO_BADGE: Record<string, "success" | "warning" | "outline"> = {
  aplicado: "success",
  pendiente_revision: "warning",
  parcial: "warning",
  descartado: "outline",
  procesando: "outline",
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
  const [mostrarAvisoPreparacion, setMostrarAvisoPreparacion] = useState(CAPTURA_IA_EN_PREPARACION);
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
    if (CAPTURA_IA_EN_PREPARACION) return;
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
    <>
      <Dialog
        open={status === "analizando" || mostrarAvisoPreparacion}
        onOpenChange={(open) => {
          if (status !== "analizando") setMostrarAvisoPreparacion(open);
        }}
      >
        <DialogContent showCloseButton={false} className="gap-5 p-6 text-center sm:max-w-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary shadow-[0_8px_22px_rgb(79_70_229/0.16)]">
            {CAPTURA_IA_EN_PREPARACION ? <Sparkles className="size-7" aria-hidden="true" /> : <Loader2 className="size-7 animate-spin" aria-hidden="true" />}
          </div>
          <DialogHeader className="items-center gap-2">
            <DialogTitle>{CAPTURA_IA_EN_PREPARACION ? "Captura IA está en preparación" : "Estamos trabajando en tu captura"}</DialogTitle>
            <DialogDescription className="max-w-xs text-center leading-6">
              {CAPTURA_IA_EN_PREPARACION
                ? "Puedes recorrer y conocer esta interfaz, pero la carga de archivos y el análisis estarán disponibles cuando configuremos la conexión con IA."
                : "Analizamos los archivos y preparamos el movimiento de inventario. No cierres esta ventana ni recargues la página."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
            {CAPTURA_IA_EN_PREPARACION
              ? "Modo de solo visualización: por ahora no se puede activar ninguna acción en esta sección."
              : "La interfaz permanece bloqueada para evitar envíos duplicados. Los audios largos pueden tardar unos minutos."}
          </div>
          {CAPTURA_IA_EN_PREPARACION && status !== "analizando" ? (
            <DialogClose render={<Button className="w-full" />}>Entendido, ver interfaz</DialogClose>
          ) : null}
        </DialogContent>
      </Dialog>

    <div className="flex max-w-5xl flex-col gap-7" aria-busy={status === "analizando"}>
      <div className="rounded-2xl border border-primary/10 bg-linear-to-br from-primary/10 via-card to-card px-6 py-7 shadow-sm md:px-8">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Sparkles className="size-5" /></div>
        <p className="mb-1 text-xs font-bold tracking-[0.16em] text-primary uppercase">Asistente de inventario</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Captura IA</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Da de alta inventario mostrando una foto o hablando — la IA propone, tú confirmas.
        </p>
      </div>

      <div className="flex w-fit rounded-xl border border-border bg-card p-1 shadow-sm">
        <Button disabled={CAPTURA_IA_EN_PREPARACION} className="rounded-lg" variant={modo === "foto" ? "default" : "ghost"} onClick={() => setModo("foto")}>
          <Camera className="size-4" />
          Foto
        </Button>
        <Button disabled={CAPTURA_IA_EN_PREPARACION} className="rounded-lg" variant={modo === "voz" ? "default" : "ghost"} onClick={() => setModo("voz")}>
          <Mic className="size-4" />
          Voz
        </Button>
        <Button disabled={CAPTURA_IA_EN_PREPARACION} className="rounded-lg" variant={modo === "foto_voz" ? "default" : "ghost"} onClick={() => setModo("foto_voz")}>
          <Video className="size-4" />
          Foto + Voz
        </Button>
      </div>

      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>{modo === "foto" ? "Añade una imagen" : modo === "voz" ? "Añade un audio" : "Añade imagen y audio"}</CardTitle>
          <p className="text-sm text-muted-foreground">Los archivos se analizan de forma segura antes de crear una propuesta.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-6">
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {modo === "foto" || modo === "foto_voz" ? (
            <div className="rounded-xl border border-dashed border-primary/35 bg-primary/3 p-5 transition-colors hover:bg-primary/6">
              <label className="flex cursor-pointer flex-col gap-1 text-sm font-semibold text-foreground">
                <span className="mb-2 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Upload className="size-4" /></span>
                Imagen
                <span className="text-xs font-normal text-muted-foreground">PNG, JPG o WEBP · máximo 10 MB</span>
              <input
                ref={imagenInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                disabled={CAPTURA_IA_EN_PREPARACION}
                onChange={handleImagenChange}
                className="mt-2 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
                aria-label="Seleccionar imagen"
              />
              </label>
              {imagen ? <p className="text-xs text-muted-foreground">{imagen.name}</p> : null}
            </div>
          ) : null}

          {modo === "voz" || modo === "foto_voz" ? (
            <div className="rounded-xl border border-dashed border-primary/35 bg-primary/3 p-5 transition-colors hover:bg-primary/6">
              <label className="flex cursor-pointer flex-col gap-1 text-sm font-semibold text-foreground">
                <span className="mb-2 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Mic className="size-4" /></span>
                Audio
                <span className="text-xs font-normal text-muted-foreground">Archivo de audio · máximo 20 MB</span>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                disabled={CAPTURA_IA_EN_PREPARACION}
                onChange={handleAudioChange}
                className="mt-2 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
                aria-label="Seleccionar audio"
              />
              </label>
              {audio ? <p className="text-xs text-muted-foreground">{audio.name}</p> : null}
            </div>
          ) : null}

          <Button disabled={CAPTURA_IA_EN_PREPARACION || !puedeAnalizar} onClick={handleAnalizar} className="w-fit px-4 shadow-sm">
            {status === "analizando" ? <Loader2 className="size-4 animate-spin" /> : null}
            Analizar
          </Button>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Historial</p><h2 className="mt-1 text-xl font-bold text-foreground">Capturas recientes</h2></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{recientes?.length ?? 0} registros</span></div>
        {recientes === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando" />
          </div>
        ) : recientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no has hecho ninguna captura.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {recientes.map((captura) => (
              <li key={captura.id}>
                <Link
                  href={`/captura-ia/${captura.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {captura.tipo === "foto" ? "Foto" : captura.tipo === "voz" ? "Voz" : "Foto + Voz"} ·{" "}
                      {captura.products.length} producto(s)
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(captura.created_at)}</p>
                  </div>
                  <Badge variant={ESTADO_BADGE[captura.estado]}>{ESTADO_LABEL[captura.estado]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </>
  );
}
