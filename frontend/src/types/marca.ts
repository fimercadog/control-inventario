export interface Marca {
  id: number;
  nombre: string;
  estado: string;
  productos_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MarcasQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreMarcaRequest/UpdateMarcaRequest (backend). `estado` is accepted on create
 * only — UpdateMarcaRequest excludes it (2026-08-10 RBAC fix, same pattern as Categorías):
 * habilitar/deshabilitar are the real dedicated actions for that. */
export interface MarcaPayload {
  nombre?: string;
}

/** Matches MarcaController::productos — the subset of ProductoResource shown in the
 * read-only Productos tab of the Ficha de Marca. Shows `categoria`, not `marca` (every row
 * already belongs to this exact marca — categoria is the useful complementary field here,
 * same reasoning CategoriaProducto applies in reverse by showing `marca`). */
export interface MarcaProducto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string | null;
  precio: number;
  estado: string;
}
