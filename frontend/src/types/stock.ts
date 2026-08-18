/** Matches StockResource. `estado` is the module's stock flag, while producto_estado
 * identifies whether the catalogue entry is unavailable (including stock exhaustion). */
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
  producto_estado: string;
  inhabilitado_por_stock: boolean;
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
