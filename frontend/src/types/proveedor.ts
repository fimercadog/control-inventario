export interface Proveedor {
  id: number;
  nombre: string;
  nit: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string | null;
  notas: string | null;
  estado: string;
  tiene_movimientos?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProveedoresQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/**
 * Matches StoreProveedorRequest. `nit`/`email` only exist here — Identity
 * fields, immutable after creation (ADR-015); UpdateProveedorRequest doesn't
 * even accept them, the backend ignores them silently if sent on edit.
 */
export interface CreateProveedorPayload {
  nombre: string;
  nit?: string | null;
  email?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  notas?: string | null;
}

/** Matches UpdateProveedorRequest exactly — no nit/email/estado. */
export interface UpdateProveedorPayload {
  nombre?: string;
  contacto?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  notas?: string | null;
}

/** Matches ProductoProveedorResource — the read-only Productos tab of the Ficha de Proveedor. */
export interface ProveedorProducto {
  id: number;
  producto_id: number;
  producto_nombre: string | null;
  es_principal: boolean;
  precio_compra: number | null;
  codigo_proveedor: string | null;
  estado: string;
}
