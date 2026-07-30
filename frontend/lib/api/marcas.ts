import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  Marca,
  PaginatedItems,
  Producto,
  StoreMarcaPayload,
  UpdateMarcaPayload,
} from "@/lib/api/types";

/** RC1 (docs/03_FUNCTIONAL_SPEC/Brands.md). */
export function listMarcas(params?: {
  busqueda?: string;
  estado?: string;
}): Promise<PaginatedItems<Marca>> {
  return unwrap<PaginatedItems<Marca>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Marca>>>("/marcas", { params })
  );
}

export function getMarca(id: number): Promise<Marca> {
  return unwrap<Marca>(apiClient.get<ApiSuccessResponse<Marca>>(`/marcas/${id}`));
}

export function createMarca(payload: StoreMarcaPayload): Promise<Marca> {
  return unwrap<Marca>(apiClient.post<ApiSuccessResponse<Marca>>("/marcas", payload));
}

export function updateMarca(id: number, payload: UpdateMarcaPayload): Promise<Marca> {
  return unwrap<Marca>(apiClient.patch<ApiSuccessResponse<Marca>>(`/marcas/${id}`, payload));
}

/** Borrado siempre lógico — nunca un DELETE físico (GLOBAL RULE, sesión 2026-07-29). */
export function disableMarca(id: number): Promise<Marca> {
  return unwrap<Marca>(apiClient.post<ApiSuccessResponse<Marca>>(`/marcas/${id}/deshabilitar`));
}

export function enableMarca(id: number): Promise<Marca> {
  return unwrap<Marca>(apiClient.post<ApiSuccessResponse<Marca>>(`/marcas/${id}/habilitar`));
}

/** Ficha de Marca — pestaña "Productos". */
export function listProductosDeMarca(marcaId: number): Promise<Producto[]> {
  return unwrap<Producto[]>(
    apiClient.get<ApiSuccessResponse<Producto[]>>(`/marcas/${marcaId}/productos`)
  );
}
