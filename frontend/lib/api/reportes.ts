import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  PaginatedReporteHistorial,
  ReporteCatalogoItem,
  ReporteFiltros,
  ReporteHistorialFiltros,
  ReporteResultado,
  ReporteResumen,
} from "@/lib/api/types";

/** Reportes (2026-08-02). Dashboard — un único endpoint compuesto, sin CRUD. */
export function getReporteResumen(params?: ReporteFiltros): Promise<ReporteResumen> {
  return unwrap<ReporteResumen>(
    apiClient.get<ApiSuccessResponse<ReporteResumen>>("/reportes", { params })
  );
}

/**
 * Centro de reportes (ampliación 2026-08-03). `previewReporte`/
 * `exportarReporte` aceptan cualquier `clave` del catálogo sin que este
 * archivo necesite conocer los 13 reportes uno por uno — el backend es
 * la única fuente de verdad sobre qué reportes existen.
 */
export function getCatalogoReportes(): Promise<ReporteCatalogoItem[]> {
  return unwrap<ReporteCatalogoItem[]>(
    apiClient.get<ApiSuccessResponse<ReporteCatalogoItem[]>>("/reportes/catalogo")
  );
}

export function previewReporte(
  clave: string,
  filtros: Record<string, string | number | undefined>
): Promise<ReporteResultado> {
  return unwrap<ReporteResultado>(
    apiClient.get<ApiSuccessResponse<ReporteResultado>>(`/reportes/${clave}/preview`, {
      params: filtros,
    })
  );
}

export type FormatoExportacion = "pdf" | "excel" | "csv";

/**
 * Los tres formatos son binarios, no JSON — `responseType: "blob"` evita
 * que axios intente parsear el PDF/XLSX/CSV como JSON. El nombre de
 * archivo lo decide `ReporteExportService` en el backend
 * (Content-Disposition), no el frontend.
 */
export async function exportarReporte(
  clave: string,
  formato: FormatoExportacion,
  filtros: Record<string, string | number | undefined>
): Promise<{ blob: Blob; nombreArchivo: string }> {
  const response = await apiClient.get(`/reportes/${clave}/exportar/${formato}`, {
    params: filtros,
    responseType: "blob",
  });

  const disposition = (response.headers["content-disposition"] as string | undefined) ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/);

  return {
    blob: response.data as Blob,
    nombreArchivo: match?.[1] ?? `${clave}.${formato === "excel" ? "xlsx" : formato}`,
  };
}

export function getHistorialReportes(params?: ReporteHistorialFiltros): Promise<PaginatedReporteHistorial> {
  return unwrap<PaginatedReporteHistorial>(
    apiClient.get<ApiSuccessResponse<PaginatedReporteHistorial>>("/reportes/historial", { params })
  );
}
