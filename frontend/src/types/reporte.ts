export interface ReporteColumna {
  clave: string;
  etiqueta: string;
}

/** Matches Reporte::filtrosDisponibles() — self-describing, so the frontend never hardcodes
 * per-report filter assumptions. `tipo` seen in the real 13 reports: "select" | "texto" |
 * "fecha". The known `select`-type filter keys across all 13 reports (closed vocabulary,
 * grepped from every app/Reports/*.php): categoria_id, marca_id, producto_id, modulo, accion,
 * tipo (movimiento), estado (activo/todos) — no other select key exists anywhere. */
export interface ReporteFiltro {
  clave: string;
  etiqueta: string;
  tipo: "select" | "texto" | "fecha" | string;
  requerido: boolean;
}

export interface ReporteCatalogoItem {
  clave: string;
  nombre: string;
  descripcion: string;
  filtros_disponibles: ReporteFiltro[];
}

/** Matches ReporteResultadoDTO::toArray() — the shared shape all 13 reports return, generic
 * on purpose (columnas+filas is enough to render any of them, per the DTO's own docblock). */
export interface ReporteResultado {
  clave: string;
  titulo: string;
  columnas: ReporteColumna[];
  filas: Record<string, unknown>[];
  resumen: Record<string, unknown>;
  filtros_aplicados: Record<string, unknown>;
  total: number;
}

export interface ReporteResumen {
  rango: { desde: string; hasta: string };
  inventario: Record<string, unknown>;
  movimientos: Record<string, unknown>;
  clientes: Record<string, unknown>;
  proveedores: Record<string, unknown>;
}

/** Matches ReporteHistorial's raw column set (index() returns $registros->items() directly,
 * no Resource wrapper). */
export interface ReporteHistorialEntry {
  id: number;
  uuid: string;
  usuario_id: number | null;
  usuario?: { id: number; email: string } | null;
  tipo_reporte: string;
  formato: string;
  filtros: Record<string, unknown> | null;
  total_filas: number;
  created_at: string;
}

/** Matches ReporteProgramado's raw column set. `estado`/`ultima_ejecucion_at` exist on the
 * model, but no execution engine exists yet (confirmed in the model's own docblock: "future-
 * ready... sin que exista todavía un motor que lo ejecute") — ultima_ejecucion_at is always
 * null in practice. The frontend must not imply these schedules actually run. */
export interface ReporteProgramadoEntry {
  id: number;
  nombre: string;
  tipo_reporte: string;
  filtros: Record<string, unknown> | null;
  formato: "pdf" | "excel" | "csv";
  frecuencia: "diaria" | "semanal" | "mensual";
  destinatarios: string[] | null;
  estado: string;
  ultima_ejecucion_at: string | null;
  proxima_ejecucion_at: string | null;
}

/** Matches StoreReporteProgramadoRequest exactly. */
export interface CreateReporteProgramadoPayload {
  nombre: string;
  tipo_reporte: string;
  filtros?: Record<string, unknown>;
  formato: "pdf" | "excel" | "csv";
  frecuencia: "diaria" | "semanal" | "mensual";
  destinatarios?: string[];
}
