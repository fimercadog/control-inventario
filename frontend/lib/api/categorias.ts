import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  Categoria,
  PaginatedItems,
  Producto,
  StoreCategoriaPayload,
  UpdateCategoriaPayload,
} from "@/lib/api/types";

/** RC1 (docs/03_FUNCTIONAL_SPEC/Categories.md). */
export function listCategorias(params?: {
  busqueda?: string;
  estado?: string;
}): Promise<PaginatedItems<Categoria>> {
  return unwrap<PaginatedItems<Categoria>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Categoria>>>("/categorias", { params })
  );
}

export function getCategoria(id: number): Promise<Categoria> {
  return unwrap<Categoria>(apiClient.get<ApiSuccessResponse<Categoria>>(`/categorias/${id}`));
}

export function createCategoria(payload: StoreCategoriaPayload): Promise<Categoria> {
  return unwrap<Categoria>(
    apiClient.post<ApiSuccessResponse<Categoria>>("/categorias", payload)
  );
}

export function updateCategoria(id: number, payload: UpdateCategoriaPayload): Promise<Categoria> {
  return unwrap<Categoria>(
    apiClient.patch<ApiSuccessResponse<Categoria>>(`/categorias/${id}`, payload)
  );
}

/** Borrado siempre lógico — nunca un DELETE físico (GLOBAL RULE, sesión 2026-07-29). */
export function disableCategoria(id: number): Promise<Categoria> {
  return unwrap<Categoria>(
    apiClient.post<ApiSuccessResponse<Categoria>>(`/categorias/${id}/deshabilitar`)
  );
}

export function enableCategoria(id: number): Promise<Categoria> {
  return unwrap<Categoria>(
    apiClient.post<ApiSuccessResponse<Categoria>>(`/categorias/${id}/habilitar`)
  );
}

/** Ficha de Categoría — pestaña "Productos". */
export function listProductosDeCategoria(categoriaId: number): Promise<Producto[]> {
  return unwrap<Producto[]>(
    apiClient.get<ApiSuccessResponse<Producto[]>>(`/categorias/${categoriaId}/productos`)
  );
}
