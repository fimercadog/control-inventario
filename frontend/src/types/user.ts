import type { Empresa } from "./auth";

/** Matches UserResource (backend). `empresa` is only present when the controller eager-loads it (not on index). */
export interface Usuario {
  id: number;
  name: string;
  email: string;
  empresa?: Empresa;
  is_platform_admin: boolean;
  is_active: boolean;
  avatar_path: string | null;
  avatar_url: string | null;
  theme: string;
  language: string;
  timezone: string;
  role: string | null;
  last_activity_at: string | null;
  last_login_ip: string | null;
  last_user_agent: string | null;
  invited_at: string | null;
  invited_by: string | null;
  created_at: string | null;
}

export interface UsuariosQueryParams {
  busqueda?: string;
  rol?: string;
  estado?: "activo" | "todos";
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreInvitationRequest (backend). There is no direct user-creation endpoint. */
export interface InvitarUsuarioPayload {
  email: string;
  role_id?: number;
}

/**
 * Matches UpdateUsuarioRequest (backend, ADR-015). `name`/`email` are Identity
 * fields and deliberately excluded — only these three Operational fields are
 * editable for another user via this endpoint.
 */
export interface ActualizarUsuarioPayload {
  theme?: "light" | "dark" | "system";
  language?: "es" | "en";
  timezone?: string;
}
