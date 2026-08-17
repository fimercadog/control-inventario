import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type {
  CreateProveedorPayload,
  Proveedor,
  ProveedoresQueryParams,
  ProveedorProducto,
  UpdateProveedorPayload,
} from "@/types/proveedor";

export async function fetchProveedores(params: ProveedoresQueryParams): Promise<PaginatedData<Proveedor>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Proveedor>>>("/proveedores", { params });
  return data.data;
}

export async function fetchProveedor(id: number): Promise<Proveedor> {
  const { data } = await apiClient.get<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}`);
  return data.data;
}

export async function crearProveedor(payload: CreateProveedorPayload): Promise<Proveedor> {
  const { data } = await apiClient.post<ApiSuccessResponse<Proveedor>>("/proveedores", payload);
  return data.data;
}

export async function actualizarProveedor(id: number, payload: UpdateProveedorPayload): Promise<Proveedor> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}`, payload);
  return data.data;
}

export async function habilitarProveedor(id: number): Promise<Proveedor> {
  const { data } = await apiClient.post<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}/habilitar`);
  return data.data;
}

export async function deshabilitarProveedor(id: number): Promise<Proveedor> {
  const { data } = await apiClient.post<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}/deshabilitar`);
  return data.data;
}

export async function fetchProductosDelProveedor(id: number): Promise<ProveedorProducto[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProveedorProducto[]>>(`/proveedores/${id}/productos`);
  return data.data;
}

export interface ProveedoresExportResult {
  blob: Blob;
  filename: string;
}

function extractFilename(contentDisposition: string | undefined, fallback: string): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/);
  return match?.[1] ?? fallback;
}

/** Same busqueda/estado params as fetchProveedores — the export reflects exactly what the
 * list is currently showing, and covers the full filtered result set, not just one page. */
export async function exportarProveedoresCsv(params: ProveedoresQueryParams): Promise<ProveedoresExportResult> {
  const response = await apiClient.get<Blob>("/proveedores/export/csv", { params, responseType: "blob" });
  return { blob: response.data, filename: extractFilename(response.headers["content-disposition"], "proveedores.csv") };
}

export async function exportarProveedoresPdf(params: ProveedoresQueryParams): Promise<ProveedoresExportResult> {
  const response = await apiClient.get<Blob>("/proveedores/export/pdf", { params, responseType: "blob" });
  return { blob: response.data, filename: extractFilename(response.headers["content-disposition"], "proveedores.pdf") };
}
