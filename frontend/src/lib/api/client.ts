import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/env";
import { getAccessToken, setAccessToken, notifySessionExpired } from "@/lib/auth/token-store";
import type { ApiSuccessResponse } from "@/types/api";
import type { LoginResult } from "@/types/auth";

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Contingencia is intentionally enforced at the transport boundary too: hiding a
// button is not sufficient because any existing screen could otherwise submit a
// normal write. The dedicated sync endpoint remains available and product writes
// are created only from the local queue.
apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const method = (config.method ?? "get").toLowerCase();
  const isWrite = !["get", "head", "options"].includes(method);
  const active = JSON.parse(window.localStorage.getItem("fidelos-contingencia") ?? "{}").activo === true;
  // Authentication must remain available so a user can enter or restore a session even
  // if this browser previously enabled contingency mode. Business writes stay blocked.
  const isAllowedDuringContingency = config.url?.includes("/contingencia/productos/sincronizar") || config.url?.includes("/auth/");
  if (active && isWrite && !isAllowedDuringContingency) {
    return Promise.reject(new Error("Modo Contingencia activo: las escrituras normales están bloqueadas."));
  }
  return config;
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let pendingRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<ApiSuccessResponse<LoginResult>>(
      `${API_BASE_URL}/auth/refresh`,
      null,
      { withCredentials: true }
    );
    const token = response.data.data.access_token;
    setAccessToken(token);
    return token;
  } catch {
    notifySessionExpired();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";
    const isAuthEndpoint = url.includes("/auth/refresh") || url.includes("/auth/login");

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      pendingRefresh ??= refreshAccessToken().finally(() => {
        pendingRefresh = null;
      });
      const newToken = await pendingRefresh;
      if (newToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
