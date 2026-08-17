/** Matches AuditLogResource. Privacy rule (confirmed non-negotiable in the backend's own
 * Resource docblock): an audit entry never exposes a real person's name — only their account
 * email and role(s). Never add a "usuario.name"-style field here; the backend doesn't send
 * one, and none should ever be synthesized on the frontend either. */
export interface AuditLogEntry {
  id: number;
  uuid: string;
  modulo: string;
  accion: string;
  auditable_type: string | null;
  auditable_id: number | null;
  valores_anteriores: Record<string, unknown> | null;
  valores_nuevos: Record<string, unknown> | null;
  resultado: string | null;
  ip: string | null;
  user_agent: string | null;
  usuario: { id: number; email: string; roles: string[] } | null;
  created_at: string;
}

export interface AuditLogQueryParams {
  busqueda?: string;
  modulo?: string;
  accion?: string;
  resultado?: string;
  desde?: string;
  hasta?: string;
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** The backend supplies these dynamically (AuditLogService::modulosDisponibles/
 * accionesDisponibles) — never hardcode a static list of modules/actions on the frontend. */
export interface AuditLogMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  modulos_disponibles: string[];
  acciones_disponibles: string[];
}
