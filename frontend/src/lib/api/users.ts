import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { AsignarRolPayload, InvitarUsuarioPayload, Usuario, UsuariosQueryParams } from "@/types/user";

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

/** No direct "create user" endpoint exists — invitation is the real flow (InvitationController::store). */
export async function invitarUsuario(payload: InvitarUsuarioPayload): Promise<void> {
  await apiClient.post("/usuarios/invitar", payload);
}

/** Independent action, not part of a generic update form — syncRoles() replaces the user's single role. */
export async function asignarRolUsuario(id: number, payload: AsignarRolPayload): Promise<Usuario> {
  const { data } = await apiClient.post<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/rol`, payload);
  return data.data;
}

/** Real admin capability (UserPolicy::update, same usuarios.editar gate) — image, max 2MB. */
export async function subirAvatarUsuario(id: number, file: File): Promise<Usuario> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.post<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/avatar`, formData);
  return data.data;
}

export async function eliminarAvatarUsuario(id: number): Promise<Usuario> {
  const { data } = await apiClient.delete<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/avatar`);
  return data.data;
}
