export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  productos_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoriasQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreCategoriaRequest/UpdateCategoriaRequest (backend). `estado` is accepted on
 * create only — UpdateCategoriaRequest deliberately excludes it (RBAC audit 2026-08-10):
 * habilitar/deshabilitar are the real dedicated actions for that. */
export interface CategoriaPayload {
  nombre?: string;
  descripcion?: string | null;
}

/** Matches CategoriaController::productos — the subset of ProductoResource shown in the
 * read-only Productos tab of the Ficha de Categoría. */
export interface CategoriaProducto {
  id: number;
  codigo: string;
  nombre: string;
  marca: string | null;
  precio: number;
  estado: string;
}
