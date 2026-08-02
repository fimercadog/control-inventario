import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiSuccessResponse, AuditLog, AuditLogFiltros, PaginatedAuditLogs } from "@/lib/api/types";

/**
 * Auditoría (2026-08-02, docs/03_FUNCTIONAL_SPEC/Auditoria.md). Solo
 * lectura por diseño — no hay create/update/delete aquí, el backend no
 * expone esos endpoints (AuditLog es inmutable).
 */
export function listAuditLogs(params?: AuditLogFiltros): Promise<PaginatedAuditLogs> {
  return unwrap<PaginatedAuditLogs>(
    apiClient.get<ApiSuccessResponse<PaginatedAuditLogs>>("/auditoria", { params })
  );
}

export function getAuditLog(id: number): Promise<AuditLog> {
  return unwrap<AuditLog>(apiClient.get<ApiSuccessResponse<AuditLog>>(`/auditoria/${id}`));
}
