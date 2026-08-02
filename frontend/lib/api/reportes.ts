import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiSuccessResponse, ReporteFiltros, ReporteResumen } from "@/lib/api/types";

/** Reportes (2026-08-02). Un único endpoint compuesto — sin CRUD. */
export function getReporteResumen(params?: ReporteFiltros): Promise<ReporteResumen> {
  return unwrap<ReporteResumen>(
    apiClient.get<ApiSuccessResponse<ReporteResumen>>("/reportes", { params })
  );
}
