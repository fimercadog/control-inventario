import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { CapturaCrmIAEntry, CapturaIAEntry, CapturaIADetalle, CorregirDetallePayload, EntidadCapturaCrm } from "@/types/captura-ia";

export async function capturarCrm(entidad: EntidadCapturaCrm, contenido: string): Promise<CapturaCrmIAEntry> {
  const { data } = await apiClient.post<ApiSuccessResponse<CapturaCrmIAEntry>>("/captura-ia/crm", { entidad, contenido });
  return data.data;
}

export async function fetchCapturasIA(page: number = 1): Promise<PaginatedData<CapturaIAEntry>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<CapturaIAEntry>>>("/captura-ia", {
    params: { page },
  });
  return data.data;
}

export async function fetchCapturaIA(uuid: string): Promise<CapturaIAEntry> {
  const { data } = await apiClient.get<ApiSuccessResponse<CapturaIAEntry>>(`/captura-ia/${uuid}`);
  return data.data;
}

export async function capturarPorFoto(imagen: File): Promise<CapturaIAEntry> {
  const formData = new FormData();
  formData.append("imagen", imagen);
  const { data } = await apiClient.post<ApiSuccessResponse<CapturaIAEntry>>("/captura-ia/foto", formData);
  return data.data;
}

export async function capturarPorVoz(audio: File): Promise<CapturaIAEntry> {
  const formData = new FormData();
  formData.append("audio", audio);
  const { data } = await apiClient.post<ApiSuccessResponse<CapturaIAEntry>>("/captura-ia/voz", formData);
  return data.data;
}

export async function capturarPorFotoVoz(imagen: File, audio: File): Promise<CapturaIAEntry> {
  const formData = new FormData();
  formData.append("imagen", imagen);
  formData.append("audio", audio);
  const { data } = await apiClient.post<ApiSuccessResponse<CapturaIAEntry>>("/captura-ia/foto-voz", formData);
  return data.data;
}

export async function confirmarCapturaIA(uuid: string): Promise<CapturaIAEntry> {
  const { data } = await apiClient.post<ApiSuccessResponse<CapturaIAEntry>>(`/captura-ia/${uuid}/confirmar`);
  return data.data;
}

export async function descartarCapturaIA(uuid: string): Promise<CapturaIAEntry> {
  const { data } = await apiClient.post<ApiSuccessResponse<CapturaIAEntry>>(`/captura-ia/${uuid}/descartar`);
  return data.data;
}

export async function corregirDetalleIA(
  uuid: string,
  detalleId: number,
  payload: CorregirDetallePayload
): Promise<CapturaIADetalle> {
  const { data } = await apiClient.patch<ApiSuccessResponse<CapturaIADetalle>>(
    `/captura-ia/${uuid}/detalle/${detalleId}`,
    payload
  );
  return data.data;
}
