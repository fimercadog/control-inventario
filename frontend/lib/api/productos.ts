import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  MovimientoProducto,
  PaginatedItems,
  Producto,
  ProductoProveedorAsociacion,
  RegistrarIngresoPayload,
  StoreProductoPayload,
  StoreProductoProveedorPayload,
  UpdateProductoPayload,
  UpdateProductoProveedorPayload,
} from "@/lib/api/types";

export function listProductos(): Promise<PaginatedItems<Producto>> {
  return unwrap<PaginatedItems<Producto>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Producto>>>("/productos")
  );
}

/** FEATURE-001 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2). */
export function createProducto(payload: StoreProductoPayload): Promise<Producto> {
  return unwrap<Producto>(
    apiClient.post<ApiSuccessResponse<Producto>>("/productos", payload)
  );
}

export function getProducto(id: number): Promise<Producto> {
  return unwrap<Producto>(apiClient.get<ApiSuccessResponse<Producto>>(`/productos/${id}`));
}

export function updateProducto(id: number, payload: UpdateProductoPayload): Promise<Producto> {
  return unwrap<Producto>(
    apiClient.patch<ApiSuccessResponse<Producto>>(`/productos/${id}`, payload)
  );
}

export function getMovimientosDeProducto(id: number): Promise<PaginatedItems<MovimientoProducto>> {
  return unwrap<PaginatedItems<MovimientoProducto>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<MovimientoProducto>>>(
      `/productos/${id}/movimientos`
    )
  );
}

/** FEATURE-002 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2). */
export function registrarIngreso(id: number, payload: RegistrarIngresoPayload): Promise<Producto> {
  return unwrap<Producto>(
    apiClient.post<ApiSuccessResponse<Producto>>(`/productos/${id}/movimientos`, payload)
  );
}

/** FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md) — pestaña "Proveedores" de la Ficha de Producto. */
export function listProveedoresDeProducto(productoId: number): Promise<ProductoProveedorAsociacion[]> {
  return unwrap<ProductoProveedorAsociacion[]>(
    apiClient.get<ApiSuccessResponse<ProductoProveedorAsociacion[]>>(`/productos/${productoId}/proveedores`)
  );
}

export function asociarProveedor(
  productoId: number,
  payload: StoreProductoProveedorPayload
): Promise<ProductoProveedorAsociacion> {
  return unwrap<ProductoProveedorAsociacion>(
    apiClient.post<ApiSuccessResponse<ProductoProveedorAsociacion>>(
      `/productos/${productoId}/proveedores`,
      payload
    )
  );
}

export function actualizarAsociacionProveedor(
  productoId: number,
  asociacionId: number,
  payload: UpdateProductoProveedorPayload
): Promise<ProductoProveedorAsociacion> {
  return unwrap<ProductoProveedorAsociacion>(
    apiClient.patch<ApiSuccessResponse<ProductoProveedorAsociacion>>(
      `/productos/${productoId}/proveedores/${asociacionId}`,
      payload
    )
  );
}

/** Borrado siempre lógico — nunca un DELETE físico (GLOBAL RULE, sesión 2026-07-29). */
export function deshabilitarAsociacionProveedor(
  productoId: number,
  asociacionId: number
): Promise<ProductoProveedorAsociacion> {
  return unwrap<ProductoProveedorAsociacion>(
    apiClient.post<ApiSuccessResponse<ProductoProveedorAsociacion>>(
      `/productos/${productoId}/proveedores/${asociacionId}/deshabilitar`
    )
  );
}
