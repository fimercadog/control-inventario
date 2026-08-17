import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { Role, RolePayload, RolesQueryParams, RoleUsuario } from "@/types/role";

export async function fetchRolesActivos(): Promise<Role[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Role>>>("/roles", {
    params: { estado: "activo", per_page: 100 },
  });
  return data.data.items;
}

export async function fetchRoles(params: RolesQueryParams): Promise<PaginatedData<Role>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Role>>>("/roles", { params });
  return data.data;
}

export async function fetchRole(id: number): Promise<Role> {
  const { data } = await apiClient.get<ApiSuccessResponse<Role>>(`/roles/${id}`);
  return data.data;
}

export async function crearRol(payload: RolePayload): Promise<Role> {
  const { data } = await apiClient.post<ApiSuccessResponse<Role>>("/roles", payload);
  return data.data;
}

export async function actualizarRol(id: number, payload: RolePayload): Promise<Role> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Role>>(`/roles/${id}`, payload);
  return data.data;
}

export async function activarRol(id: number): Promise<Role> {
  const { data } = await apiClient.post<ApiSuccessResponse<Role>>(`/roles/${id}/activar`);
  return data.data;
}

export async function desactivarRol(id: number): Promise<Role> {
  const { data } = await apiClient.post<ApiSuccessResponse<Role>>(`/roles/${id}/desactivar`);
  return data.data;
}

export async function fetchUsuariosDelRol(id: number): Promise<RoleUsuario[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<RoleUsuario[]>>(`/roles/${id}/usuarios`);
  return data.data;
}

export interface RolesExportResult {
  blob: Blob;
  filename: string;
}

function extractFilename(contentDisposition: string | undefined, fallback: string): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/);
  return match?.[1] ?? fallback;
}

/** Same busqueda/estado params as fetchRoles — the export reflects exactly what the list
 * is currently showing, and covers the full filtered result set, not just one page. */
export async function exportarRolesCsv(params: RolesQueryParams): Promise<RolesExportResult> {
  const response = await apiClient.get<Blob>("/roles/export/csv", { params, responseType: "blob" });
  return { blob: response.data, filename: extractFilename(response.headers["content-disposition"], "roles.csv") };
}

export async function exportarRolesPdf(params: RolesQueryParams): Promise<RolesExportResult> {
  const response = await apiClient.get<Blob>("/roles/export/pdf", { params, responseType: "blob" });
  return { blob: response.data, filename: extractFilename(response.headers["content-disposition"], "roles.pdf") };
}
