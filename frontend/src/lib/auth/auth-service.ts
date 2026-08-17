import { apiClient } from "@/lib/api/client";
import { setAccessToken, clearAccessToken } from "@/lib/auth/token-store";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  AuthenticatedUser,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResult,
  ResetPasswordPayload,
} from "@/types/auth";

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<LoginResult>>("/auth/login", payload);
  setAccessToken(data.data.access_token);
  return data.data;
}

export async function refresh(): Promise<LoginResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<LoginResult>>("/auth/refresh");
  setAccessToken(data.data.access_token);
  return data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
  clearAccessToken();
}

export async function me(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.get<ApiSuccessResponse<AuthenticatedUser>>("/auth/me");
  return data.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiClient.post("/auth/password/olvide", payload);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post("/auth/password/restablecer", payload);
}
