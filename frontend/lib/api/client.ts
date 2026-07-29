import axios, { AxiosError } from "axios";
import { API_URL } from "@/lib/config";
import { getAccessToken, notifySessionExpired, setAccessToken } from "@/lib/api/auth-token";
import type { ApiErrorResponse, ApiSuccessResponse, AuthTokenResponse } from "@/lib/api/types";

export const apiClient = axios.create({
  baseURL: API_URL,
  // El refresh token viaja en una cookie httpOnly (docs/04_ARCHITECTURE.md);
  // sin esto el navegador nunca la envía ni la guarda entre localhost:3000
  // y localhost:8000.
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ENDPOINTS_WITHOUT_RETRY = ["/auth/login", "/auth/refresh"];

let refreshPromise: Promise<string | null> | null = null;

function isAuthEndpoint(url?: string): boolean {
  return AUTH_ENDPOINTS_WITHOUT_RETRY.some((path) => url?.includes(path));
}

/**
 * Si varias requests reciben 401 al mismo tiempo (el access token expiró
 * mientras había varias en vuelo), todas esperan el mismo refresh en vez
 * de disparar uno cada una.
 */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<ApiSuccessResponse<AuthTokenResponse>>("/auth/refresh")
      .then((response) => {
        const token = response.data.data.access_token;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      original &&
      !isAuthEndpoint(original.url) &&
      !(original as { _retried?: boolean })._retried
    ) {
      (original as { _retried?: boolean })._retried = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      notifySessionExpired();
    }

    return Promise.reject(error);
  }
);

/**
 * Error normalizado con un mensaje seguro para mostrar directo en la UI.
 * Nunca se debe mostrar JSON crudo al usuario (requisito de UX de Fase 4).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const body = axiosError.response?.data;

    if (body && "message" in body) {
      const fieldErrors =
        body.errors && !Array.isArray(body.errors)
          ? (body.errors as Record<string, string[]>)
          : undefined;

      return new ApiError(body.message, axiosError.response?.status, fieldErrors);
    }

    if (axiosError.code === "ECONNABORTED" || !axiosError.response) {
      return new ApiError(
        "No pudimos conectar con el servidor. Verifica tu conexión e intenta de nuevo."
      );
    }
  }

  return new ApiError("Ocurrió un error inesperado. Intenta de nuevo.");
}

/**
 * Desenvuelve el sobre {success, message, data} del backend y devuelve
 * solo el payload tipado, o lanza un ApiError con mensaje amigable.
 */
export async function unwrap<T>(
  promise: Promise<{ data: ApiSuccessResponse<T> }>
): Promise<T> {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}
