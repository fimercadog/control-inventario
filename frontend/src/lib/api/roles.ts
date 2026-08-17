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
