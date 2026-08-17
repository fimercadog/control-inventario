export interface Role {
  id: number;
  name: string;
  estado: string;
  permisos?: string[];
  permisos_count?: number;
  usuarios_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RolesQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreRoleRequest/UpdateRoleRequest (backend). No `descripcion` field exists. */
export interface RolePayload {
  name?: string;
  estado?: "activo" | "inactivo";
  permisos?: string[];
}

/** Matches RoleController::usuarios — a flat, unpaginated list, read-only from this module. */
export interface RoleUsuario {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}
