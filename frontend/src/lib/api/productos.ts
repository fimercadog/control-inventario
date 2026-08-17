import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type {
  CreateProductoPayload,
  Producto,
  ProductoMovimiento,
  ProductosQueryParams,
  RegistrarIngresoPayload,
  UpdateProductoPayload,
} from "@/types/producto";

export async function fetchProductos(params: ProductosQueryParams): Promise<PaginatedData<Producto>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Producto>>>("/productos", { params });
  return data.data;
}

export async function fetchProducto(id: number): Promise<Producto> {
  const { data } = await apiClient.get<ApiSuccessResponse<Producto>>(`/productos/${id}`);
  return data.data;
}

export async function crearProducto(payload: CreateProductoPayload): Promise<Producto> {
  const { data } = await apiClient.post<ApiSuccessResponse<Producto>>("/productos", payload);
  return data.data;
}

export async function actualizarProducto(id: number, payload: UpdateProductoPayload): Promise<Producto> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Producto>>(`/productos/${id}`, payload);
  return data.data;
}

export async function habilitarProducto(id: number): Promise<Producto> {
  const { data } = await apiClient.post<ApiSuccessResponse<Producto>>(`/productos/${id}/habilitar`);
  return data.data;
}

export async function deshabilitarProducto(id: number): Promise<Producto> {
  const { data } = await apiClient.post<ApiSuccessResponse<Producto>>(`/productos/${id}/deshabilitar`);
  return data.data;
}

export async function fetchMovimientosDeProducto(
  id: number,
  page: number = 1
): Promise<PaginatedData<ProductoMovimiento>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<ProductoMovimiento>>>(
    `/productos/${id}/movimientos`,
    { params: { page } }
  );
  return data.data;
}

/** Devuelve el Producto actualizado (stock_actual incluido) — mismo Resource que
 * fetchProducto, no un Movimiento suelto (ProductoController::registrarIngreso lo confirma). */
export async function registrarIngreso(id: number, payload: RegistrarIngresoPayload): Promise<Producto> {
  const { data } = await apiClient.post<ApiSuccessResponse<Producto>>(`/productos/${id}/movimientos`, payload);
  return data.data;
}

// No CSV/PDF export: ProductoController has no exportarCsv/exportarPdf and routes/api.php has
// no export/csv|pdf under v1/productos. See frontend/incidentes/INCIDENTES.md (INC-003 pattern).
