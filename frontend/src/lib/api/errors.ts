import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api";

export function extractApiErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
}

export function extractApiFieldErrors(error: unknown): Record<string, string[]> | undefined {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data?.errors) {
    const errors = error.response.data.errors;
    return Array.isArray(errors) ? undefined : errors;
  }
  return undefined;
}
