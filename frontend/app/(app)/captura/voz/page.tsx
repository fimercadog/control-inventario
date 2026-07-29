"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, Sparkles, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AiProcessingState } from "@/components/ai-processing-state";
import { VoiceWave } from "@/components/voice-wave";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { captureByVoice } from "@/lib/api/captura-ia";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const PROCESSING_MESSAGES = [
  "Subiendo tu audio...",
  "Transcribiendo tu voz...",
  "Identificando el producto...",
  "Guardando en tu inventario...",
];

export default function VoiceCapturePage() {
  const router = useRouter();
  const empresaId = useAppSelector((state) => state.auth.user?.empresa_id);
  const { status, audioBlob, audioUrl, error, start, stop, reset } = useAudioRecorder();
  const [processing, setProcessing] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  async function analyze() {
    if (!audioBlob || !empresaId) return;
    setProcessing(true);
    try {
      const captura = await captureByVoice(empresaId, audioBlob, idempotencyKey);
      router.push(`/captura/revisar/${captura.id}`);
    } catch (err) {
      setProcessing(false);
      toast.error(err instanceof Error ? err.message : "No pudimos entender el audio.");
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
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-3xl">🎤</span>
        <h1 className="text-2xl font-semibold tracking-tight">Captura por voz</h1>
        <p className="text-sm text-muted-foreground">
          Dicta el movimiento en lenguaje natural, como le hablarías a un compañero.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Grabación</CardTitle>
          <CardDescription>Ej. &quot;Entraron cinco bolsas de Dog Chow Adultos&quot;.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 py-4">
          <button
            type="button"
            onClick={status === "recording" ? stop : status === "idle" ? start : undefined}
            disabled={status === "recorded"}
            className={cn(
              "relative flex size-28 items-center justify-center rounded-full text-primary-foreground shadow-xl transition-all",
              status === "recording"
                ? "bg-destructive shadow-destructive/30"
                : "bg-primary shadow-primary/30 hover:scale-105",
              status === "recorded" && "opacity-50"
            )}
          >
            {status === "recording" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />
            )}
            {status === "recording" ? (
              <VoiceWave active />
            ) : (
              <Mic className="size-10" />
            )}
            {status === "recording" && (
              <Square className="absolute bottom-2 right-2 size-5 rounded bg-background p-1 text-destructive" />
            )}
          </button>

          <p className="text-sm font-medium text-muted-foreground">
            {status === "idle" && "Toca para grabar"}
            {status === "recording" && "Grabando... toca para detener"}
            {status === "recorded" && "Audio listo"}
          </p>

          {status === "recorded" && audioUrl && (
            <div className="flex w-full flex-col items-center gap-3">
              <audio src={audioUrl} controls className="w-full" />
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
                  <RotateCcw className="size-4" />
                  Grabar de nuevo
                </Button>
                <Button className="flex-1 gap-2" onClick={analyze}>
                  <Sparkles className="size-4" />
                  Analizar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
