import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type {
  UnidadMedida,
  UnidadMedidaPayload,
  UnidadMedidaProducto,
  UnidadesMedidaQueryParams,
} from "@/types/unidad-medida";

export async function fetchUnidadesMedida(params: UnidadesMedidaQueryParams): Promise<PaginatedData<UnidadMedida>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<UnidadMedida>>>("/unidades-medida", {
    params,
  });
  return data.data;
}

export async function fetchUnidadMedida(id: number): Promise<UnidadMedida> {
  const { data } = await apiClient.get<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}`);
  return data.data;
}

export async function crearUnidadMedida(payload: UnidadMedidaPayload): Promise<UnidadMedida> {
  const { data } = await apiClient.post<ApiSuccessResponse<UnidadMedida>>("/unidades-medida", payload);
  return data.data;
}

export async function actualizarUnidadMedida(id: number, payload: UnidadMedidaPayload): Promise<UnidadMedida> {
  const { data } = await apiClient.patch<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}`, payload);
  return data.data;
}

export async function habilitarUnidadMedida(id: number): Promise<UnidadMedida> {
  const { data } = await apiClient.post<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}/habilitar`);
  return data.data;
}

export async function deshabilitarUnidadMedida(id: number): Promise<UnidadMedida> {
  const { data } = await apiClient.post<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}/deshabilitar`);
  return data.data;
}

export async function fetchProductosDeUnidadMedida(id: number): Promise<UnidadMedidaProducto[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<UnidadMedidaProducto[]>>(`/unidades-medida/${id}/productos`);
  return data.data;
}

// No CSV/PDF export: UnidadMedidaController has no exportarCsv/exportarPdf and routes/api.php
// has no export/csv|pdf under v1/unidades-medida. See frontend/incidentes/INCIDENTES.md (INC-003).
