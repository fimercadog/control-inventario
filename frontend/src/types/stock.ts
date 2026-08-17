/** Matches StockResource. `estado` here is `stock_estado` — a flag owned by this module,
 * independent of the product's own `estado` (confirmed: StockController::index hardcodes
 * ->where('estado', 'activo') on the underlying Producto, so a disabled Product never
 * appears here regardless of this stock-level filter). */
export interface StockItem {
  id: number;
  codigo: string | null;
  nombre: string;
  categoria: string | null;
  marca: string | null;
  unidad_medida: string | null;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  bajo_minimo: boolean;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface StockQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  bajo_minimo?: boolean;
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches UpdateStockRequest exactly — only the alert thresholds, never stock_actual. */
export interface UpdateStockPayload {
  stock_minimo?: number;
  stock_maximo?: number | null;
}
