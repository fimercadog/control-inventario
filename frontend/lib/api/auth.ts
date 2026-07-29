import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiSuccessResponse, AuthenticatedUser, AuthTokenResponse } from "@/lib/api/types";

export function login(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<AuthTokenResponse> {
  return unwrap<AuthTokenResponse>(
    apiClient.post<ApiSuccessResponse<AuthTokenResponse>>("/auth/login", {
      email,
      password,
      remember_me: rememberMe,
    })
  );
}

export function logout(): Promise<null> {
  return unwrap<null>(apiClient.post<ApiSuccessResponse<null>>("/auth/logout"));
}

/** Rota el refresh token (cookie httpOnly) y emite un access token nuevo. */
export function refresh(): Promise<AuthTokenResponse> {
  return unwrap<AuthTokenResponse>(
    apiClient.post<ApiSuccessResponse<AuthTokenResponse>>("/auth/refresh")
  );
}

export function me(): Promise<AuthenticatedUser> {
  return unwrap<AuthenticatedUser>(
    apiClient.get<ApiSuccessResponse<AuthenticatedUser>>("/auth/me")
  );
}

export function forgotPassword(email: string): Promise<null> {
  return unwrap<null>(
    apiClient.post<ApiSuccessResponse<null>>("/auth/password/olvide", { email })
  );
}

export function resetPassword(
  token: string,
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<null> {
  return unwrap<null>(
    apiClient.post<ApiSuccessResponse<null>>("/auth/password/restablecer", {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
  );
}
