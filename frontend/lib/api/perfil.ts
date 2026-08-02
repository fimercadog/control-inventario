import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  AuthenticatedUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "@/lib/api/types";

/**
 * Perfil (2026-08-02, docs/03_FUNCTIONAL_SPEC/Profile.md). Sin GET — la
 * ficha propia ya se obtiene de GET /auth/me (auth-slice la trae al
 * arrancar la app).
 */
export function updateProfile(payload: UpdateProfilePayload): Promise<AuthenticatedUser> {
  return unwrap<AuthenticatedUser>(
    apiClient.patch<ApiSuccessResponse<AuthenticatedUser>>("/perfil", payload)
  );
}

export function uploadAvatar(archivo: File): Promise<AuthenticatedUser> {
  const form = new FormData();
  form.append("avatar", archivo);

  return unwrap<AuthenticatedUser>(
    apiClient.post<ApiSuccessResponse<AuthenticatedUser>>("/perfil/avatar", form)
  );
}

export function removeAvatar(): Promise<AuthenticatedUser> {
  return unwrap<AuthenticatedUser>(
    apiClient.delete<ApiSuccessResponse<AuthenticatedUser>>("/perfil/avatar")
  );
}

/** Revoca todas las sesiones — el llamador debe redirigir a /login tras un éxito. */
export function changePassword(payload: ChangePasswordPayload): Promise<null> {
  return unwrap<null>(
    apiClient.post<ApiSuccessResponse<null>>("/perfil/password", payload)
  );
}
