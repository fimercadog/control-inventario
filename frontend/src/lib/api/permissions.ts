import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";

/** Matches PermissionController::index — flat, alphabetical, excludes the plataforma.* namespace. */
export async function fetchPermisos(): Promise<string[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<string[]>>("/permisos");
  return data.data;
}
