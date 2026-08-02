import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  PaginatedItems,
  Role,
  StoreRolePayload,
  UpdateRolePayload,
  UsuarioAsignadoRol,
} from "@/lib/api/types";

/** Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md). */
export function listRoles(params?: {
  busqueda?: string;
  estado?: string;
  page?: number;
}): Promise<PaginatedItems<Role>> {
  return unwrap<PaginatedItems<Role>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Role>>>("/roles", { params })
  );
}

export function getRole(id: number): Promise<Role> {
  return unwrap<Role>(apiClient.get<ApiSuccessResponse<Role>>(`/roles/${id}`));
}

export function createRole(payload: StoreRolePayload): Promise<Role> {
  return unwrap<Role>(apiClient.post<ApiSuccessResponse<Role>>("/roles", payload));
}

export function updateRole(id: number, payload: UpdateRolePayload): Promise<Role> {
  return unwrap<Role>(apiClient.patch<ApiSuccessResponse<Role>>(`/roles/${id}`, payload));
}

/** Desactivación siempre lógica — nunca un DELETE físico. Rechaza 409 si el rol tiene usuarios asignados. */
export function desactivarRole(id: number): Promise<Role> {
  return unwrap<Role>(apiClient.post<ApiSuccessResponse<Role>>(`/roles/${id}/desactivar`));
}

export function activarRole(id: number): Promise<Role> {
  return unwrap<Role>(apiClient.post<ApiSuccessResponse<Role>>(`/roles/${id}/activar`));
}

export function listUsuariosDeRole(roleId: number): Promise<UsuarioAsignadoRol[]> {
  return unwrap<UsuarioAsignadoRol[]>(
    apiClient.get<ApiSuccessResponse<UsuarioAsignadoRol[]>>(`/roles/${roleId}/usuarios`)
  );
}

/** Catálogo global de solo lectura — para el selector de permisos al crear/editar un rol. */
export function listPermisos(): Promise<string[]> {
  return unwrap<string[]>(apiClient.get<ApiSuccessResponse<string[]>>("/permisos"));
}
