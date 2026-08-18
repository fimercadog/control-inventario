import type { Movimiento } from "@/types/movimiento";
import type { Producto } from "@/types/producto";

/** Matches the read-only response of GET /dashboard. */
export interface DashboardSummary {
  total_productos: number;
  total_stock: number;
  productos_stock_bajo: number;
  entradas_hoy: number;
  salidas_hoy: number;
  movimientos_recientes: Movimiento[];
  productos_con_stock_bajo: Producto[];
}
