import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  CreateAsociacionPayload,
  ProductoProveedorAsociacion,
  UpdateAsociacionPayload,
} from "@/types/producto-proveedor";

export async function fetchProveedoresDeProducto(productoId: number): Promise<ProductoProveedorAsociacion[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProductoProveedorAsociacion[]>>(
    `/productos/${productoId}/proveedores`
  );
  return data.data;
}

export async function asociarProveedor(
  productoId: number,
  payload: CreateAsociacionPayload
): Promise<ProductoProveedorAsociacion> {
  const { data } = await apiClient.post<ApiSuccessResponse<ProductoProveedorAsociacion>>(
    `/productos/${productoId}/proveedores`,
    payload
  );
  return data.data;
}

export async function actualizarAsociacion(
  productoId: number,
  asociacionId: number,
  payload: UpdateAsociacionPayload
): Promise<ProductoProveedorAsociacion> {
  const { data } = await apiClient.patch<ApiSuccessResponse<ProductoProveedorAsociacion>>(
    `/productos/${productoId}/proveedores/${asociacionId}`,
    payload
  );
  return data.data;
}

/** No hay endpoint "enable" — ProductoProveedorPolicy no declara esa ability (confirmado
 * contra el Controller real: solo index/store/update/disable). Una asociación deshabilitada
 * solo puede reemplazarse creando una nueva, nunca reactivarse. */
export async function deshabilitarAsociacion(productoId: number, asociacionId: number): Promise<ProductoProveedorAsociacion> {
  const { data } = await apiClient.post<ApiSuccessResponse<ProductoProveedorAsociacion>>(
    `/productos/${productoId}/proveedores/${asociacionId}/deshabilitar`
  );
  return data.data;
}
