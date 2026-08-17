export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string | null;
  estado: string;
  productos_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UnidadesMedidaQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreUnidadMedidaRequest/UpdateUnidadMedidaRequest (backend). `estado` is accepted
 * on create only — UpdateUnidadMedidaRequest excludes it (2026-08-10 RBAC fix, same pattern as
 * Categorías/Marcas): habilitar/deshabilitar are the real dedicated actions for that. */
export interface UnidadMedidaPayload {
  nombre?: string;
  abreviatura?: string | null;
}

/** Matches UnidadMedidaController::productos — shows `categoria` and `marca` (the two
 * complementary axes), not `unidad_medida` itself since every row already belongs to this
 * exact unit. */
export interface UnidadMedidaProducto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string | null;
  marca: string | null;
  precio: number;
  estado: string;
}
