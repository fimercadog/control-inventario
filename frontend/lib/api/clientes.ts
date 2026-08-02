import { apiClient, unwrap } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  Cliente,
  PaginatedItems,
  StoreClientePayload,
  UpdateClientePayload,
} from "@/lib/api/types";

/** Módulo Clientes (2026-08-02, docs/03_FUNCTIONAL_SPEC/Customers.md). */
export function listClientes(params?: {
  busqueda?: string;
  estado?: string;
  page?: number;
}): Promise<PaginatedItems<Cliente>> {
  return unwrap<PaginatedItems<Cliente>>(
    apiClient.get<ApiSuccessResponse<PaginatedItems<Cliente>>>("/clientes", { params })
  );
}

export function getCliente(id: number): Promise<Cliente> {
  return unwrap<Cliente>(apiClient.get<ApiSuccessResponse<Cliente>>(`/clientes/${id}`));
}

export function createCliente(payload: StoreClientePayload): Promise<Cliente> {
  return unwrap<Cliente>(apiClient.post<ApiSuccessResponse<Cliente>>("/clientes", payload));
}

export function updateCliente(id: number, payload: UpdateClientePayload): Promise<Cliente> {
  return unwrap<Cliente>(apiClient.patch<ApiSuccessResponse<Cliente>>(`/clientes/${id}`, payload));
}

/** Borrado siempre lógico — nunca un DELETE físico (GLOBAL RULE, sesión 2026-07-29). */
export function disableCliente(id: number): Promise<Cliente> {
  return unwrap<Cliente>(apiClient.post<ApiSuccessResponse<Cliente>>(`/clientes/${id}/deshabilitar`));
}

export function enableCliente(id: number): Promise<Cliente> {
  return unwrap<Cliente>(apiClient.post<ApiSuccessResponse<Cliente>>(`/clientes/${id}/habilitar`));
}
