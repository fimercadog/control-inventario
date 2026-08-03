import { apiClient, unwrap } from "@/lib/api/client";
import type {
  AcceptInvitationPayload,
  ApiSuccessResponse,
  InvitacionInfo,
  InviteUsuarioPayload,
} from "@/lib/api/types";

/**
 * Módulo 6 — Invitaciones (2026-08-03, docs/03_FUNCTIONAL_SPEC/Users.md,
 * Decisión 1). `inviteUsuario` requiere sesión + `usuarios.invitar`
 * (mismo `apiClient` autenticado que el resto del app). `getInvitacion`/
 * `acceptInvitation` son deliberadamente públicas — quien las llama
 * todavía no tiene cuenta, así que se usan desde una página fuera del
 * grupo de rutas `(app)` (sin sidebar, sin guard de sesión).
 */
export function inviteUsuario(payload: InviteUsuarioPayload): Promise<void> {
  return unwrap<void>(apiClient.post<ApiSuccessResponse<void>>("/usuarios/invitar", payload));
}

export function getInvitacion(token: string): Promise<InvitacionInfo> {
  return unwrap<InvitacionInfo>(
    apiClient.get<ApiSuccessResponse<InvitacionInfo>>(`/invitaciones/${token}`)
  );
}

export function acceptInvitation(token: string, payload: AcceptInvitationPayload): Promise<void> {
  return unwrap<void>(
    apiClient.post<ApiSuccessResponse<void>>(`/invitaciones/${token}/aceptar`, payload)
  );
}
