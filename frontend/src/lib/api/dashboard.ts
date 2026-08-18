import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

export async function fetchDashboard(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<DashboardSummary>>("/dashboard");
  return data.data;
}
