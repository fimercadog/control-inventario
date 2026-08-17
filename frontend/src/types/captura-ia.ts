export type TipoCapturaIA = "foto" | "voz" | "foto_voz";
export type EstadoCapturaIA = "procesando" | "pendiente_revision" | "aplicado" | "parcial" | "descartado";
export type EstadoDetalleIA = "pendiente_revision" | "aplicado" | "corregido" | "descartado";

/** Matches CapturaIADetalleResource — one detected "product" line item. Same vocabulary as
 * the AI provider contract (name/brand/presentation/category/quantity/unit/confidence). */
export interface CapturaIADetalle {
  id: number;
  name: string;
  brand: string | null;
  presentation: string | null;
  category: string | null;
  quantity: number;
  unit: string | null;
  confidence: number;
  es_producto_nuevo: boolean;
  producto_id: number | null;
  movimiento_id: number | null;
  estado: EstadoDetalleIA;
}

/** Matches CapturaIAResource. `id` is the capture's uuid (public identifier, never the
 * internal numeric id — confirmed in the Resource's own docblock). */
export interface CapturaIAEntry {
  id: string;
  tipo: TipoCapturaIA;
  estado: EstadoCapturaIA;
  movement: string | null;
  proveedor: string | null;
  tiempo_procesamiento_ms: number | null;
  confianza_promedio: number;
  transcripcion: string | null;
  products: CapturaIADetalle[];
  created_at: string;
}

/** Matches UpdateDetalleRequest exactly — the only fields a low-confidence detail can be
 * corrected on before confirming. */
export interface CorregirDetallePayload {
  nombre_detectado?: string;
  marca_detectado?: string | null;
  categoria_detectado?: string | null;
  presentacion_detectado?: string | null;
  unidad_detectado?: string | null;
  cantidad_detectada?: number;
}

/** A detail is only editable/confirmable while pendiente_revision or corregido — aplicado/
 * descartado are terminal (confirmed against CapturaIAService::ESTADOS_EDITABLES). */
export const ESTADOS_EDITABLES: EstadoDetalleIA[] = ["pendiente_revision", "corregido"];
