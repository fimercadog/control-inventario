import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedItems, Usuario } from "@/lib/api/types";

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). Listar/Ver/Activar/
 * Desactivar únicamente — sin `createUsuario` ni `deleteUsuario` a
 * propósito: no existen esas acciones en este módulo.
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
