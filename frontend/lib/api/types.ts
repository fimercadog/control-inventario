/**
 * Espejo de App\Http\Support\ApiResponse (backend, seccion 41 del master
 * spec): toda respuesta exitosa tiene esta forma.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[]> | unknown[];
}

/** Espejo de App\Http\Resources\Auth\AuthenticatedUserResource. */
export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  empresa_id: number | null;
  is_platform_admin: boolean;
  avatar_path: string | null;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  permissions: string[];
}

/** Espejo del body de POST /auth/login, /auth/refresh. */
export interface AuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: AuthenticatedUser;
}

/** Espejo de App\Http\Resources\CapturaIA\CapturaIADetalleResource. */
export interface DetectedProduct {
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
  estado: "pendiente_revision" | "aplicado" | "corregido" | "descartado";
}

export type TipoCaptura = "foto" | "voz" | "foto_voz";

export type EstadoCaptura =
  | "procesando"
  | "pendiente_revision"
  | "aplicado"
  | "parcial"
  | "descartado";

/** Espejo de App\Http\Resources\CapturaIA\CapturaIAResource. */
export interface CapturaIA {
  id: string; // uuid
  tipo: TipoCaptura;
  estado: EstadoCaptura;
  movement: string;
  proveedor: string;
  tiempo_procesamiento_ms: number | null;
  confianza_promedio: number;
  transcripcion: string | null;
  products: DetectedProduct[];
  created_at: string;
}

export interface PaginatedItems<T> {
  items: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}
