import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { CreateMovimientoPayload, Movimiento, MovimientosQueryParams, UpdateMovimientoPayload } from "@/types/movimiento";

export async function fetchMovimientos(params: MovimientosQueryParams): Promise<PaginatedData<Movimiento>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Movimiento>>>("/movimientos", { params });
  return data.data;
}

export async function fetchMovimiento(id: number): Promise<Movimiento> {
  const { data } = await apiClient.get<ApiSuccessResponse<Movimiento>>(`/movimientos/${id}`);
  return data.data;
}

export async function crearMovimiento(payload: CreateMovimientoPayload): Promise<Movimiento> {
  const { data } = await apiClient.post<ApiSuccessResponse<Movimiento>>("/movimientos", payload);
  return data.data;
}

/** Metadata only (documento/observacion/lote/vencimiento) — see UpdateMovimientoPayload's
 * docblock. No disable/enable/delete: a movement is never removable or reversible, by design
 * (no such routes exist in routes/api.php, confirmed). */
export async function actualizarMovimiento(id: number, payload: UpdateMovimientoPayload): Promise<Movimiento> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Movimiento>>(`/movimientos/${id}`, payload);
  return data.data;
}
