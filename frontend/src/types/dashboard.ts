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
  crm: {
    contactos: number;
    prospectos: number;
    oportunidades_abiertas: number;
    valor_pipeline: number;
    actividades_pendientes: number;
    actividades_vencidas: number;
    oportunidades_destacadas: Array<{ id: number; nombre: string; monto: number; fecha_cierre_estimada: string | null; cliente: string | null; etapa: string | null; responsable: string | null }>;
    proximas_actividades: Array<{ id: number; asunto: string; tipo: string; programada_para: string; cliente: string | null; oportunidad: string | null; responsable: string | null }>;
  };
}
