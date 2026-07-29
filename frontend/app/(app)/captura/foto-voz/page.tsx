"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, ImagePlus, Mic, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AiProcessingState } from "@/components/ai-processing-state";
import { VoiceWave } from "@/components/voice-wave";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { captureByPhotoAndVoice } from "@/lib/api/captura-ia";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const PROCESSING_MESSAGES = [
  "Subiendo imagen y audio...",
  "Analizando la imagen...",
  "Transcribiendo tu voz...",
  "Combinando resultados...",
  "Guardando en tu inventario...",
];

export default function PhotoVoiceCapturePage() {
  const router = useRouter();
  const empresaId = useAppSelector((state) => state.auth.user?.empresa_id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const { status, audioBlob, audioUrl, error, start, stop, reset: resetAudio } = useAudioRecorder();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  function handleFile(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function resetImage() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  const canAnalyze = !!file && !!audioBlob && !!empresaId;

  async function analyze() {
    if (!file || !audioBlob || !empresaId) return;
    setProcessing(true);
    try {
      const captura = await captureByPhotoAndVoice(empresaId, file, audioBlob, idempotencyKey);
      router.push(`/captura/revisar/${captura.id}`);
    } catch (err) {
      setProcessing(false);
      toast.error(err instanceof Error ? err.message : "No pudimos combinar la foto y el audio.");
    }
  }

  if (processing) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center">
        <Card className="w-full border-border/60">
          <CardContent>
            <AiProcessingState messages={PROCESSING_MESSAGES} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-3xl">✨</span>
        <h1 className="text-2xl font-semibold tracking-tight">Foto + Voz</h1>
        <p className="text-sm text-muted-foreground">
          La foto identifica el producto, tu voz confirma la cantidad y el movimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">1. Foto</CardTitle>
            <CardDescription>El producto que quieres registrar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted">
                <Image
                  src={previewUrl}
                  alt="Vista previa de la foto"
                  width={600}
                  height={450}
                  unoptimized
                  className="aspect-square w-full object-cover"
                />
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="absolute right-2 top-2 shadow"
                  onClick={resetImage}
                  aria-label="Quitar foto"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-center">
                <ImagePlus className="size-7 text-muted-foreground" />
                <p className="px-4 text-xs text-muted-foreground">Sube o toma una foto</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="size-4" />
                Cámara
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="size-4" />
                Subir
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">2. Voz</CardTitle>
            <CardDescription>Ej. &quot;Entraron cinco&quot;.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 py-2">
            <button
              type="button"
              onClick={status === "recording" ? stop : status === "idle" ? start : undefined}
              disabled={status === "recorded"}
              className={cn(
                "relative flex size-20 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-all",
                status === "recording"
                  ? "bg-destructive shadow-destructive/30"
                  : "bg-primary shadow-primary/30 hover:scale-105",
                status === "recorded" && "opacity-50"
              )}
            >
              {status === "recording" && (
                <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />
              )}
              {status === "recording" ? <VoiceWave active /> : <Mic className="size-8" />}
              {status === "recording" && (
                <Square className="absolute bottom-1 right-1 size-4 rounded bg-background p-0.5 text-destructive" />
              )}
            </button>
            <p className="text-xs font-medium text-muted-foreground">
              {status === "idle" && "Toca para grabar"}
              {status === "recording" && "Grabando... toca para detener"}
              {status === "recorded" && "Audio listo"}
            </p>
            {status === "recorded" && audioUrl && (
              <div className="flex w-full flex-col items-center gap-2">
                <audio src={audioUrl} controls className="w-full" />
                <Button variant="outline" size="sm" className="gap-2" onClick={resetAudio}>
                  <RotateCcw className="size-3.5" />
                  Grabar de nuevo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button size="lg" className="h-12 gap-2 text-base" disabled={!canAnalyze} onClick={analyze}>
        <Sparkles className="size-4" />
        Analizar foto + voz
      </Button>
    </div>
  );
}
