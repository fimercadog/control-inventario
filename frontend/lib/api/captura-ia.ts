import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  CapturaIA,
  DetectedProduct,
  PaginatedItems,
} from "@/lib/api/types";

function withIdempotencyKey(idempotencyKey?: string) {
  return idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined;
}

export function captureByPhoto(
  empresaId: number,
  imagen: File,
  idempotencyKey?: string
): Promise<CapturaIA> {
  const form = new FormData();
  form.append("empresa_id", String(empresaId));
  form.append("imagen", imagen);

  return unwrap<CapturaIA>(
    apiClient.post<ApiSuccessResponse<CapturaIA>>("/captura-ia/foto", form, {
      headers: withIdempotencyKey(idempotencyKey),
    })
  );
}

export function captureByVoice(
  empresaId: number,
  audio: File | Blob,
  idempotencyKey?: string
): Promise<CapturaIA> {
  const form = new FormData();
  form.append("empresa_id", String(empresaId));
  form.append("audio", audio, "audio.webm");

  return unwrap<CapturaIA>(
    apiClient.post<ApiSuccessResponse<CapturaIA>>("/captura-ia/voz", form, {
      headers: withIdempotencyKey(idempotencyKey),
    })
  );
}

export function captureByPhotoAndVoice(
  empresaId: number,
  imagen: File,
  audio: File | Blob,
  idempotencyKey?: string
): Promise<CapturaIA> {
  const form = new FormData();
  form.append("empresa_id", String(empresaId));
  form.append("imagen", imagen);
  form.append("audio", audio, "audio.webm");

  return unwrap<CapturaIA>(
    apiClient.post<ApiSuccessResponse<CapturaIA>>("/captura-ia/foto-voz", form, {
      headers: withIdempotencyKey(idempotencyKey),
    })
  );
}

export function listCaptures(empresaId: number): Promise<PaginatedItems<CapturaIA>> {
  return unwrap<PaginatedItems<CapturaIA>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<CapturaIA>>>("/captura-ia", {
      params: { empresa_id: empresaId },
    })
  );
}

export function getCapture(uuid: string): Promise<CapturaIA> {
  return unwrap<CapturaIA>(
    apiClient.get<ApiSuccessResponse<CapturaIA>>(`/captura-ia/${uuid}`)
  );
}

export function confirmCapture(uuid: string): Promise<CapturaIA> {
  return unwrap<CapturaIA>(
    apiClient.post<ApiSuccessResponse<CapturaIA>>(`/captura-ia/${uuid}/confirmar`)
  );
}

export function discardCapture(uuid: string): Promise<CapturaIA> {
  return unwrap<CapturaIA>(
    apiClient.post<ApiSuccessResponse<CapturaIA>>(`/captura-ia/${uuid}/descartar`)
  );
}

export interface DetailCorrection {
  nombre_detectado?: string;
  marca_detectado?: string | null;
  categoria_detectado?: string | null;
  presentacion_detectado?: string | null;
  unidad_detectado?: string | null;
  cantidad_detectada?: number;
}

export function correctDetail(
  uuid: string,
  detalleId: number,
  correction: DetailCorrection
): Promise<DetectedProduct> {
  return unwrap<DetectedProduct>(
    apiClient.patch<ApiSuccessResponse<DetectedProduct>>(
      `/captura-ia/${uuid}/detalle/${detalleId}`,
      correction
    )
  );
}
