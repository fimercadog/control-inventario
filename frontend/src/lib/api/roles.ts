import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { Role } from "@/types/role";

export async function fetchRolesActivos(): Promise<Role[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Role>>>("/roles", {
    params: { estado: "activo", per_page: 100 },
  });
  return data.data.items;
}
