import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type { Producto } from "@/types/producto";
import type { OperacionContingencia } from "@/lib/contingencia/store";
import type { OperacionActividadContingencia } from "@/lib/contingencia/store";

export async function sincronizarOperacionContingencia(operacion: OperacionContingencia): Promise<Producto> {
  const { data } = await apiClient.post<ApiSuccessResponse<Producto>>("/contingencia/productos/sincronizar", {
    operacion_id: operacion.id,
    tipo: operacion.tipo,
    producto_id: operacion.productoId,
    base_version: operacion.baseVersion,
    payload: operacion.payload,
  });
  return data.data;
}

export async function sincronizarActividadContingencia(operacion: OperacionActividadContingencia): Promise<void> {
  await apiClient.post("/contingencia/actividades/sincronizar", { operacion_id: operacion.id, payload: operacion.payload });
}
