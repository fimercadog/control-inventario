import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type {
  ActualizarUsuarioPayload,
  InvitarUsuarioPayload,
  Usuario,
  UsuariosQueryParams,
} from "@/types/user";

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

/** ADR-015: only theme/language/timezone are editable here — name/email are Identity fields, never sent. */
export async function actualizarUsuario(id: number, payload: ActualizarUsuarioPayload): Promise<Usuario> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Usuario>>(`/usuarios/${id}`, payload);
  return data.data;
}
