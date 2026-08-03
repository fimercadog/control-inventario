import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedItems, Usuario } from "@/lib/api/types";

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md), ampliado 2026-08-03.
 * Listar/Ver/Activar/Desactivar/Asignar rol — sin `createUsuario` ni
 * `deleteUsuario` a propósito: crear sigue siendo exclusivo de
 * `lib/api/invitaciones.ts`, y no existe ningún endpoint de eliminar.
 */
export function listUsuarios(params?: {
  busqueda?: string;
  estado?: string;
  rol?: string;
  page?: number;
}): Promise<PaginatedItems<Usuario>> {
  return unwrap<PaginatedItems<Usuario>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Usuario>>>("/usuarios", { params })
  );
}

export function getUsuario(id: number): Promise<Usuario> {
  return unwrap<Usuario>(apiClient.get<ApiSuccessResponse<Usuario>>(`/usuarios/${id}`));
}

export function activarUsuario(id: number): Promise<Usuario> {
  return unwrap<Usuario>(apiClient.post<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/activar`));
}

/** Rechazada con 409 si es la propia cuenta o el último usuario con permiso de gestión. */
export function desactivarUsuario(id: number): Promise<Usuario> {
  return unwrap<Usuario>(apiClient.post<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/desactivar`));
}

/** Reemplaza el rol del usuario — nunca lo agrega a una lista, este ERP modela un único rol por usuario. */
export function asignarRolUsuario(id: number, roleId: number): Promise<Usuario> {
  return unwrap<Usuario>(
    apiClient.post<ApiSuccessResponse<Usuario>>(`/usuarios/${id}/rol`, { role_id: roleId })
  );
}
