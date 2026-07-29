"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, ImagePlus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AiProcessingState } from "@/components/ai-processing-state";
import { captureByPhoto } from "@/lib/api/captura-ia";
import { useAppSelector } from "@/store/hooks";

const PROCESSING_MESSAGES = [
  "Subiendo tu foto...",
  "Analizando la imagen...",
  "Identificando productos...",
  "Guardando en tu inventario...",
];

export default function PhotoCapturePage() {
  const router = useRouter();
  const empresaId = useAppSelector((state) => state.auth.user?.empresa_id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  function handleFile(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function reset() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  async function analyze() {
    if (!file || !empresaId) return;
    setProcessing(true);
    try {
      const captura = await captureByPhoto(empresaId, file, idempotencyKey);
      router.push(`/captura/revisar/${captura.id}`);
    } catch (error) {
      setProcessing(false);
      toast.error(error instanceof Error ? error.message : "No pudimos analizar la foto.");
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
        <span className="text-3xl">📷</span>
        <h1 className="text-2xl font-semibold tracking-tight">Captura por foto</h1>
        <p className="text-sm text-muted-foreground">
          Toma o sube una foto de tus productos. Detectamos todo lo que hay en la imagen.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Imagen</CardTitle>
          <CardDescription>Formatos JPG o PNG, hasta 10 MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted">
              <Image
                src={previewUrl}
                alt="Vista previa de la foto"
                width={800}
                height={600}
                unoptimized
                className="aspect-video w-full object-cover"
              />
              <Button
                size="icon-sm"
                variant="secondary"
                className="absolute right-2 top-2 shadow"
                onClick={reset}
                aria-label="Quitar foto"
              >
                <X />
              </Button>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border text-center">
              <ImagePlus className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arrastra una imagen o usa los botones de abajo
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-12 gap-2"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-4" />
              Usar cámara
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Subir imagen
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

          <Button size="lg" className="h-12 gap-2 text-base" disabled={!file || !empresaId} onClick={analyze}>
            <Sparkles className="size-4" />
            Analizar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
