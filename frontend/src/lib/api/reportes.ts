import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type {
  CreateReporteProgramadoPayload,
  ReporteCatalogoItem,
  ReporteHistorialEntry,
  ReporteProgramadoEntry,
  ReporteResultado,
  ReporteResumen,
} from "@/types/reporte";

export async function fetchResumenReportes(desde?: string, hasta?: string): Promise<ReporteResumen> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReporteResumen>>("/reportes", { params: { desde, hasta } });
  return data.data;
}

export async function fetchCatalogoReportes(): Promise<ReporteCatalogoItem[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReporteCatalogoItem[]>>("/reportes/catalogo");
  return data.data;
}

export async function fetchPreviewReporte(
  clave: string,
  filtros: Record<string, string | number | undefined>,
  page: number
): Promise<ReporteResultado & { meta: PaginatedData<unknown>["meta"] }> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReporteResultado & { meta: PaginatedData<unknown>["meta"] }>>(
    `/reportes/${clave}/preview`,
    { params: { ...filtros, page } }
  );
  return data.data;
}

export interface ReporteExportResult {
  blob: Blob;
  filename: string;
}

function extractFilename(contentDisposition: string | undefined, fallback: string): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/);
  return match?.[1] ?? fallback;
}

export async function exportarReportePdf(
  clave: string,
  filtros: Record<string, string | number | undefined>
): Promise<ReporteExportResult> {
  const response = await apiClient.get<Blob>(`/reportes/${clave}/exportar/pdf`, { params: filtros, responseType: "blob" });
  return { blob: response.data, filename: extractFilename(response.headers["content-disposition"], `${clave}.pdf`) };
}

export async function exportarReporteExcel(
  clave: string,
  filtros: Record<string, string | number | undefined>
): Promise<ReporteExportResult> {
  const response = await apiClient.get<Blob>(`/reportes/${clave}/exportar/excel`, { params: filtros, responseType: "blob" });
  return { blob: response.data, filename: extractFilename(response.headers["content-disposition"], `${clave}.xlsx`) };
}

export async function exportarReporteCsv(
  clave: string,
  filtros: Record<string, string | number | undefined>
): Promise<ReporteExportResult> {
  const response = await apiClient.get<Blob>(`/reportes/${clave}/exportar/csv`, { params: filtros, responseType: "blob" });
  return { blob: response.data, filename: extractFilename(response.headers["content-disposition"], `${clave}.csv`) };
}

export async function fetchHistorialReportes(params: {
  tipo_reporte?: string;
  formato?: string;
  desde?: string;
  hasta?: string;
  page?: number;
}): Promise<PaginatedData<ReporteHistorialEntry>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<ReporteHistorialEntry>>>("/reportes/historial", {
    params,
  });
  return data.data;
}

export async function fetchReportesProgramados(): Promise<ReporteProgramadoEntry[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReporteProgramadoEntry[]>>("/reportes/programados");
  return data.data;
}

export async function crearReporteProgramado(payload: CreateReporteProgramadoPayload): Promise<ReporteProgramadoEntry> {
  const { data } = await apiClient.post<ApiSuccessResponse<ReporteProgramadoEntry>>("/reportes/programados", payload);
  return data.data;
}

export async function eliminarReporteProgramado(id: number): Promise<void> {
  await apiClient.delete(`/reportes/programados/${id}`);
}
