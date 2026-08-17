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

/**
 * Matches StoreInvitationRequest (backend). There is no direct user-creation
 * endpoint, and no `name` field — the invitee sets their own name when they
 * accept the invitation (InvitationService::aceptar), not the inviting admin.
 */
export interface InvitarUsuarioPayload {
  email: string;
  role_id?: number;
}

/** Matches AssignRoleRequest (backend). Single role — syncRoles() replaces, not adds. */
export interface AsignarRolPayload {
  role_id: number;
}
