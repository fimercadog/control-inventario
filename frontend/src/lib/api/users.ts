import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { Usuario, UsuariosQueryParams } from "@/types/user";

export async function fetchUsuarios(
  params: UsuariosQueryParams
): Promise<PaginatedData<Usuario>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Usuario>>>("/usuarios", {
    params,
  });
  return data.data;
}

export async function fetchUsuario(id: number): Promise<Usuario> {
  const { data } = await apiClient.get<ApiSuccessResponse<Usuario>>(`/usuarios/${id}`);
  return data.data;
}

export async function activarUsuario(id: number): Promise<Usuario> {
  const { data } = await apiClient.post<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/activar`);
  return data.data;
}

export async function desactivarUsuario(id: number): Promise<Usuario> {
  const { data } = await apiClient.post<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/desactivar`);
  return data.data;
}
