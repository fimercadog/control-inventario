import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { Categoria, CategoriaPayload, CategoriaProducto, CategoriasQueryParams } from "@/types/categoria";

export async function fetchCategorias(params: CategoriasQueryParams): Promise<PaginatedData<Categoria>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Categoria>>>("/categorias", { params });
  return data.data;
}

export async function fetchCategoria(id: number): Promise<Categoria> {
  const { data } = await apiClient.get<ApiSuccessResponse<Categoria>>(`/categorias/${id}`);
  return data.data;
}

export async function crearCategoria(payload: CategoriaPayload): Promise<Categoria> {
  const { data } = await apiClient.post<ApiSuccessResponse<Categoria>>("/categorias", payload);
  return data.data;
}

export async function actualizarCategoria(id: number, payload: CategoriaPayload): Promise<Categoria> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Categoria>>(`/categorias/${id}`, payload);
  return data.data;
}

export async function habilitarCategoria(id: number): Promise<Categoria> {
  const { data } = await apiClient.post<ApiSuccessResponse<Categoria>>(`/categorias/${id}/habilitar`);
  return data.data;
}

export async function deshabilitarCategoria(id: number): Promise<Categoria> {
  const { data } = await apiClient.post<ApiSuccessResponse<Categoria>>(`/categorias/${id}/deshabilitar`);
  return data.data;
}

export async function fetchProductosDeCategoria(id: number): Promise<CategoriaProducto[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<CategoriaProducto[]>>(`/categorias/${id}/productos`);
  return data.data;
}
