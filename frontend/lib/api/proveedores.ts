import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  PaginatedItems,
  ProductoProveedorAsociacion,
  Proveedor,
  StoreProveedorPayload,
  UpdateProveedorPayload,
} from "@/lib/api/types";

/** FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). */
export function listProveedores(params?: {
  busqueda?: string;
  estado?: string;
}): Promise<PaginatedItems<Proveedor>> {
  return unwrap<PaginatedItems<Proveedor>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Proveedor>>>("/proveedores", { params })
  );
}

export function getProveedor(id: number): Promise<Proveedor> {
  return unwrap<Proveedor>(apiClient.get<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}`));
}

export function createProveedor(payload: StoreProveedorPayload): Promise<Proveedor> {
  return unwrap<Proveedor>(
    apiClient.post<ApiSuccessResponse<Proveedor>>("/proveedores", payload)
  );
}

export function updateProveedor(id: number, payload: UpdateProveedorPayload): Promise<Proveedor> {
  return unwrap<Proveedor>(
    apiClient.patch<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}`, payload)
  );
}

/** Borrado siempre lógico — nunca un DELETE físico (GLOBAL RULE, sesión 2026-07-29). */
export function disableProveedor(id: number): Promise<Proveedor> {
  return unwrap<Proveedor>(
    apiClient.post<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}/deshabilitar`)
  );
}

export function enableProveedor(id: number): Promise<Proveedor> {
  return unwrap<Proveedor>(
    apiClient.post<ApiSuccessResponse<Proveedor>>(`/proveedores/${id}/habilitar`)
  );
}

/** FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md) — pestaña "Productos" de la Ficha de Proveedor. */
export function listProductosDeProveedor(proveedorId: number): Promise<ProductoProveedorAsociacion[]> {
  return unwrap<ProductoProveedorAsociacion[]>(
    apiClient.get<ApiSuccessResponse<ProductoProveedorAsociacion[]>>(`/proveedores/${proveedorId}/productos`)
  );
}
