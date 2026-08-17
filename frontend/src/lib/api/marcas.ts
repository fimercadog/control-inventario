import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { Marca, MarcaPayload, MarcaProducto, MarcasQueryParams } from "@/types/marca";

export async function fetchMarcas(params: MarcasQueryParams): Promise<PaginatedData<Marca>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Marca>>>("/marcas", { params });
  return data.data;
}

export async function fetchMarca(id: number): Promise<Marca> {
  const { data } = await apiClient.get<ApiSuccessResponse<Marca>>(`/marcas/${id}`);
  return data.data;
}

export async function crearMarca(payload: MarcaPayload): Promise<Marca> {
  const { data } = await apiClient.post<ApiSuccessResponse<Marca>>("/marcas", payload);
  return data.data;
}

export async function actualizarMarca(id: number, payload: MarcaPayload): Promise<Marca> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Marca>>(`/marcas/${id}`, payload);
  return data.data;
}

export async function habilitarMarca(id: number): Promise<Marca> {
  const { data } = await apiClient.post<ApiSuccessResponse<Marca>>(`/marcas/${id}/habilitar`);
  return data.data;
}

export async function deshabilitarMarca(id: number): Promise<Marca> {
  const { data } = await apiClient.post<ApiSuccessResponse<Marca>>(`/marcas/${id}/deshabilitar`);
  return data.data;
}

export async function fetchProductosDeMarca(id: number): Promise<MarcaProducto[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<MarcaProducto[]>>(`/marcas/${id}/productos`);
  return data.data;
}

// No CSV/PDF export here: MarcaController has no exportarCsv/exportarPdf and routes/api.php has
// no export/csv|pdf under v1/marcas. Adding it would require new backend routes/controller
// methods, which spec.md's Regla Absoluta forbids. See frontend/incidentes/INCIDENTES.md (INC-003).
