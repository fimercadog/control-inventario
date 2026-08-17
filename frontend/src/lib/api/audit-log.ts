import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type { AuditLogEntry, AuditLogMeta, AuditLogQueryParams } from "@/types/audit-log";

export interface AuditLogPage {
  items: AuditLogEntry[];
  meta: AuditLogMeta;
}

export async function fetchAuditLog(params: AuditLogQueryParams): Promise<AuditLogPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<AuditLogPage>>("/auditoria", { params });
  return data.data;
}

export async function fetchAuditLogEntry(id: number): Promise<AuditLogEntry> {
  const { data } = await apiClient.get<ApiSuccessResponse<AuditLogEntry>>(`/auditoria/${id}`);
  return data.data;
}
