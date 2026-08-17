import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { StockItem, StockQueryParams, UpdateStockPayload } from "@/types/stock";

export async function fetchStock(params: StockQueryParams): Promise<PaginatedData<StockItem>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<StockItem>>>("/stock", { params });
  return data.data;
}

export async function fetchStockItem(productoId: number): Promise<StockItem> {
  const { data } = await apiClient.get<ApiSuccessResponse<StockItem>>(`/stock/${productoId}`);
  return data.data;
}

export async function actualizarStock(productoId: number, payload: UpdateStockPayload): Promise<StockItem> {
  const { data } = await apiClient.patch<ApiSuccessResponse<StockItem>>(`/stock/${productoId}`, payload);
  return data.data;
}

export async function habilitarStock(productoId: number): Promise<StockItem> {
  const { data } = await apiClient.post<ApiSuccessResponse<StockItem>>(`/stock/${productoId}/habilitar`);
  return data.data;
}

export async function deshabilitarStock(productoId: number): Promise<StockItem> {
  const { data } = await apiClient.post<ApiSuccessResponse<StockItem>>(`/stock/${productoId}/deshabilitar`);
  return data.data;
}
