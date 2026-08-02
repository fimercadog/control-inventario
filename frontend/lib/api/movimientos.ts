import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  Movimiento,
  PaginatedItems,
  StoreMovimientoPayload,
  UpdateMovimientoPayload,
} from "@/lib/api/types";

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Módulo global —
 * distinto de `getMovimientosDeProducto` (historial acotado a un solo
 * producto, ver lib/api/productos.ts, sin cambios). Sin
 * disable/enable/delete a propósito: un movimiento nunca se elimina ni
 * se anula.
 */
export function listMovimientos(params?: {
  busqueda?: string;
  tipo?: string;
  producto_id?: number;
  desde?: string;
  hasta?: string;
  page?: number;
}): Promise<PaginatedItems<Movimiento>> {
  return unwrap<PaginatedItems<Movimiento>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Movimiento>>>("/movimientos", { params })
  );
}

export function getMovimiento(id: number): Promise<Movimiento> {
  return unwrap<Movimiento>(apiClient.get<ApiSuccessResponse<Movimiento>>(`/movimientos/${id}`));
}

/** Entrada/Salida/Ajuste, siempre vía InventoryService del lado del backend. */
export function createMovimiento(payload: StoreMovimientoPayload): Promise<Movimiento> {
  return unwrap<Movimiento>(
    apiClient.post<ApiSuccessResponse<Movimiento>>("/movimientos", payload)
  );
}

/** Solo metadata descriptiva (documento/observación/lote/vencimiento). */
export function updateMovimiento(id: number, payload: UpdateMovimientoPayload): Promise<Movimiento> {
  return unwrap<Movimiento>(
    apiClient.patch<ApiSuccessResponse<Movimiento>>(`/movimientos/${id}`, payload)
  );
}
