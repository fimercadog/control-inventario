import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type { AuthenticatedUser } from "@/types/auth";

/** Matches UpdateProfileRequest exactly — theme/language/timezone only. name/email are
 * Identity fields, fixed at invitation-accept time (ADR-015), never accepted here. */
export interface UpdateProfilePayload {
  theme?: "light" | "dark" | "system";
  language?: "es" | "en";
  timezone?: string;
}

export async function actualizarPerfil(payload: UpdateProfilePayload): Promise<AuthenticatedUser> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AuthenticatedUser>>("/perfil", payload);
  return data.data;
}

export async function subirAvatarPerfil(file: File): Promise<AuthenticatedUser> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.post<ApiSuccessResponse<AuthenticatedUser>>("/perfil/avatar", formData);
  return data.data;
}

export async function eliminarAvatarPerfil(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.delete<ApiSuccessResponse<AuthenticatedUser>>("/perfil/avatar");
  return data.data;
}

/** On success the backend revokes every session (same mechanism as password recovery) —
 * the caller must redirect to /login, the in-memory access token stops working as soon as
 * it expires (confirmed against ProfileController::cambiarPassword's own docblock). */
export async function cambiarPasswordPerfil(passwordActual: string, password: string, passwordConfirmation: string): Promise<void> {
  await apiClient.post("/perfil/password", {
    password_actual: passwordActual,
    password,
    password_confirmation: passwordConfirmation,
  });
}
