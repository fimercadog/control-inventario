import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  PaginatedItems,
  Producto,
  StoreUnidadMedidaPayload,
  UnidadMedida,
  UpdateUnidadMedidaPayload,
} from "@/lib/api/types";

/** RC1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). */
export function listUnidadesMedida(params?: {
  busqueda?: string;
  estado?: string;
}): Promise<PaginatedItems<UnidadMedida>> {
  return unwrap<PaginatedItems<UnidadMedida>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<UnidadMedida>>>("/unidades-medida", { params })
  );
}

export function getUnidadMedida(id: number): Promise<UnidadMedida> {
  return unwrap<UnidadMedida>(
    apiClient.get<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}`)
  );
}

export function createUnidadMedida(payload: StoreUnidadMedidaPayload): Promise<UnidadMedida> {
  return unwrap<UnidadMedida>(
    apiClient.post<ApiSuccessResponse<UnidadMedida>>("/unidades-medida", payload)
  );
}

export function updateUnidadMedida(
  id: number,
  payload: UpdateUnidadMedidaPayload
): Promise<UnidadMedida> {
  return unwrap<UnidadMedida>(
    apiClient.patch<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}`, payload)
  );
}

/** Borrado siempre lógico — nunca un DELETE físico (GLOBAL RULE, sesión 2026-07-29). */
export function disableUnidadMedida(id: number): Promise<UnidadMedida> {
  return unwrap<UnidadMedida>(
    apiClient.post<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}/deshabilitar`)
  );
}

export function enableUnidadMedida(id: number): Promise<UnidadMedida> {
  return unwrap<UnidadMedida>(
    apiClient.post<ApiSuccessResponse<UnidadMedida>>(`/unidades-medida/${id}/habilitar`)
  );
}

/** Ficha de Unidad de Medida — pestaña "Productos". */
export function listProductosDeUnidadMedida(unidadMedidaId: number): Promise<Producto[]> {
  return unwrap<Producto[]>(
    apiClient.get<ApiSuccessResponse<Producto[]>>(`/unidades-medida/${unidadMedidaId}/productos`)
  );
}
