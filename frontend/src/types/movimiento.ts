export type TipoMovimiento = "entrada" | "salida" | "ajuste";

/** Matches MovimientoResource. */
export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  producto_id: number;
  producto: string | null;
  producto_codigo: string | null;
  unidad_medida: string | null;
  usuario: string | null;
  cantidad: number;
  delta: number;
  stock_anterior: number;
  stock_nuevo: number;
  documento: string | null;
  observacion: string | null;
  proveedor: string | null;
  proveedor_id: number | null;
  lote: string | null;
  vencimiento: string | null;
  origen: "captura_ia" | "manual";
  tiene_evidencia: boolean;
  created_at: string;
}

export interface MovimientosQueryParams {
  busqueda?: string;
  tipo?: TipoMovimiento;
  producto_id?: number;
  desde?: string;
  hasta?: string;
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreMovimientoRequest. `direccion` only applies to (and is required for) tipo
 * "ajuste" — prohibited otherwise (confirmed against the real Request's
 * required_if/prohibited_unless rules). `proveedor_id` only allowed for tipo "entrada". */
export interface CreateMovimientoPayload {
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  direccion?: "incremento" | "decremento";
  costo?: number | null;
  precio?: number | null;
  proveedor_id?: number | null;
  documento?: string | null;
  observacion?: string | null;
  lote?: string | null;
  vencimiento?: string | null;
}

/** Matches UpdateMovimientoRequest exactly — metadata only. cantidad/tipo/producto_id/
 * proveedor_id/stock_anterior/stock_nuevo are permanently immutable once created (confirmed
 * against the real Request, Controller, and Policy docblocks — a deliberate, already-confirmed
 * business rule, not a gap). */
export interface UpdateMovimientoPayload {
  documento?: string | null;
  observacion?: string | null;
  lote?: string | null;
  vencimiento?: string | null;
}
