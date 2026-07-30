import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedItems, Stock, UpdateStockPayload } from "@/lib/api/types";

/**
 * RC1 Fase 2 (docs/03_FUNCTIONAL_SPEC/Stock.md). Stock NO es una entidad
 * independiente — sin `createStock`/`store`, a propósito: cada producto
 * ya nace con sus propios campos de stock.
 */
export function listStock(params?: {
  busqueda?: string;
  estado?: string;
  bajo_minimo?: boolean;
}): Promise<PaginatedItems<Stock>> {
  return unwrap<PaginatedItems<Stock>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Stock>>>("/stock", { params })
  );
}

export function getStock(productoId: number): Promise<Stock> {
  return unwrap<Stock>(apiClient.get<ApiSuccessResponse<Stock>>(`/stock/${productoId}`));
}

/** Solo puede modificar stock_minimo/stock_maximo — nunca stock_actual. */
export function updateStock(productoId: number, payload: UpdateStockPayload): Promise<Stock> {
  return unwrap<Stock>(apiClient.patch<ApiSuccessResponse<Stock>>(`/stock/${productoId}`, payload));
}

/**
 * Puramente administrativo: oculta el producto del listado de Stock.
 * Nunca modifica stock_actual, nunca genera un movimiento, nunca afecta
 * el estado de catálogo del producto.
 */
export function disableStock(productoId: number): Promise<Stock> {
  return unwrap<Stock>(apiClient.post<ApiSuccessResponse<Stock>>(`/stock/${productoId}/deshabilitar`));
}

export function enableStock(productoId: number): Promise<Stock> {
  return unwrap<Stock>(apiClient.post<ApiSuccessResponse<Stock>>(`/stock/${productoId}/habilitar`));
}
