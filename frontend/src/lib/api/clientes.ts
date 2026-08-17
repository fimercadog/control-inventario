import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse, PaginatedData } from "@/types/api";
import type { Cliente, ClientesQueryParams, CreateClientePayload, UpdateClientePayload } from "@/types/cliente";

export async function fetchClientes(params: ClientesQueryParams): Promise<PaginatedData<Cliente>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedData<Cliente>>>("/clientes", { params });
  return data.data;
}

export async function fetchCliente(id: number): Promise<Cliente> {
  const { data } = await apiClient.get<ApiSuccessResponse<Cliente>>(`/clientes/${id}`);
  return data.data;
}

export async function crearCliente(payload: CreateClientePayload): Promise<Cliente> {
  const { data } = await apiClient.post<ApiSuccessResponse<Cliente>>("/clientes", payload);
  return data.data;
}

export async function actualizarCliente(id: number, payload: UpdateClientePayload): Promise<Cliente> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Cliente>>(`/clientes/${id}`, payload);
  return data.data;
}

export async function habilitarCliente(id: number): Promise<Cliente> {
  const { data } = await apiClient.post<ApiSuccessResponse<Cliente>>(`/clientes/${id}/habilitar`);
  return data.data;
}

export async function deshabilitarCliente(id: number): Promise<Cliente> {
  const { data } = await apiClient.post<ApiSuccessResponse<Cliente>>(`/clientes/${id}/deshabilitar`);
  return data.data;
}

// No Productos tab, no CSV/PDF export: ClienteController has neither a productos() endpoint
// nor exportarCsv/exportarPdf, and routes/api.php declares no such routes under v1/clientes.
// See frontend/incidentes/INCIDENTES.md (INC-003 covers export; no incident needed for the
// products tab — it was never in scope, unlike Proveedores/Categorías/Marcas/Unidades).
