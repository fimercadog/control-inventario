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
  /** Módulo Perfil (2026-08-02) — null solo para Platform Super Admin (sin empresa). */
  empresa: { id: number; nombre: string } | null;
  is_platform_admin: boolean;
  avatar_path: string | null;
  /** URL lista para usar en un <img>, computada por el backend a partir de avatar_path. */
  avatar_url: string | null;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  /** RC1 (docs/03_FUNCTIONAL_SPEC/Roles.md) — null si el usuario no tiene rol asignado todavía. */
  role: string | null;
  /** Módulo Perfil (2026-08-02) — todos los roles, no solo el primero. */
  roles: string[];
  permissions: string[];
}

// `name` deliberadamente ausente — campo de identidad, inmutable después
// de crear la cuenta (ADR-015, auditoría de campos editables 2026-08-04).
export interface UpdateProfilePayload {
  theme?: "light" | "dark" | "system";
  language?: "es" | "en";
  timezone?: string;
}

export interface ChangePasswordPayload {
  password_actual: string;
  password: string;
  password_confirmation: string;
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

/** Espejo de App\Http\Resources\Producto\ProductoResource. */
export interface Producto {
  id: number;
  codigo: string | null;
  codigo_barras: string | null;
  nombre: string;
  marca_id: number | null;
  /** Nombre resuelto desde la relación — solo lectura, ver marca_id/marca_nuevo para escritura. */
  marca: string | null;
  descripcion: string | null;
  presentacion: string | null;
  categoria_id: number | null;
  categoria: string | null;
  costo: number;
  precio: number;
  unidad_medida_id: number | null;
  /** Nombre resuelto desde la relación — solo lectura, ver unidad_medida_id/unidad_medida_nuevo para escritura. */
  unidad_medida: string | null;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  imagen: string | null;
  estado: "activo" | "inactivo";
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Campos editables vía PATCH /productos/{id} — nunca stock_actual.
 * `marca_id`/`unidad_medida_id` seleccionan catálogo existente;
 * `marca_nuevo`/`unidad_medida_nuevo` crean uno al vuelo (RC1 Fase 1,
 * docs/03_FUNCTIONAL_SPEC/Brands.md, UnitsOfMeasure.md) — mismo patrón
 * mutuamente excluyente que proveedor_id/proveedor_nuevo.
 */
export type UpdateProductoPayload = Partial<
  Pick<
    Producto,
    | "nombre"
    | "marca_id"
    | "descripcion"
    | "presentacion"
    | "categoria_id"
    | "costo"
    | "precio"
    | "unidad_medida_id"
    | "stock_minimo"
    | "stock_maximo"
    | "estado"
  > & { marca_nuevo: string; unidad_medida_nuevo: string }
>;

/** FEATURE-001 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2) — POST /productos. */
export type StoreProductoPayload = Partial<
  Pick<
    Producto,
    | "codigo"
    | "codigo_barras"
    | "marca_id"
    | "descripcion"
    | "presentacion"
    | "categoria_id"
    | "costo"
    | "precio"
    | "unidad_medida_id"
    | "stock_minimo"
    | "stock_maximo"
    | "estado"
  > & { marca_nuevo: string; unidad_medida_nuevo: string }
> & { nombre: string };

/**
 * FEATURE-002 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2) — POST
 * /productos/{id}/movimientos. `proveedor_id`/`proveedor_nuevo` son
 * mutuamente excluyentes (FEATURE-003, Suppliers.md): seleccionar un
 * proveedor existente o crear uno al vuelo.
 */
export interface RegistrarIngresoPayload {
  cantidad: number;
  costo?: number;
  proveedor_id?: number;
  proveedor_nuevo?: string;
  documento?: string;
  observacion?: string;
  lote?: string;
  vencimiento?: string;
}

/** Espejo de App\Http\Resources\Proveedor\ProveedorResource (FEATURE-003, docs/03_FUNCTIONAL_SPEC/Suppliers.md). */
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
  estado: "activo" | "inactivo";
  tiene_movimientos?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type StoreProveedorPayload = Partial<
  Pick<
    Proveedor,
    "nit" | "contacto" | "telefono" | "email" | "direccion" | "ciudad" | "pais" | "notas" | "estado"
  >
> & { nombre: string };

export type UpdateProveedorPayload = Partial<StoreProveedorPayload>;

/** Espejo de App\Http\Resources\Cliente\ClienteResource (2026-08-02, docs/03_FUNCTIONAL_SPEC/Customers.md). */
export interface Cliente {
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
  estado: "activo" | "inactivo";
  created_at: string | null;
  updated_at: string | null;
}

export type StoreClientePayload = Partial<
  Pick<Cliente, "nit" | "contacto" | "telefono" | "email" | "direccion" | "ciudad" | "pais" | "notas" | "estado">
> & { nombre: string };

export type UpdateClientePayload = Partial<StoreClientePayload>;

/**
 * Espejo de App\Http\Resources\Role\RoleResource (Módulo 5, 2026-08-02,
 * docs/security/ROLES_MATRIX.md). `permisos` solo viene poblado cuando el
 * backend cargó la relación (`show`/`store`/`update`) — en el listado
 * viene `permisos_count` en su lugar.
 */
export interface Role {
  id: number;
  name: string;
  estado: "activo" | "inactivo";
  permisos?: string[];
  permisos_count?: number;
  usuarios_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface StoreRolePayload {
  name: string;
  estado?: "activo" | "inactivo";
  permisos?: string[];
}

export type UpdateRolePayload = Partial<StoreRolePayload>;

/** Usuario asignado a un rol — GET /roles/{id}/usuarios. */
export interface UsuarioAsignadoRol {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

/**
 * Espejo de App\Http\Resources\Audit\AuditLogResource (Auditoría,
 * 2026-08-02, docs/03_FUNCTIONAL_SPEC/Auditoria.md). Regla de privacidad
 * no negociable: `usuario` NUNCA trae un campo `name` — solo `email` y
 * `roles`. No agregar `name` aquí aunque el backend algún día lo exponga
 * por error; ver Auditoria.md antes de tocar este tipo.
 */
export interface AuditLog {
  id: number;
  uuid: string;
  modulo: string;
  accion: string;
  auditable_type: string | null;
  auditable_id: number | null;
  valores_anteriores: Record<string, unknown> | null;
  valores_nuevos: Record<string, unknown> | null;
  resultado: string | null;
  ip: string | null;
  user_agent: string | null;
  usuario: { id: number; email: string; roles: string[] } | null;
  created_at: string | null;
}

export interface AuditLogFiltros {
  busqueda?: string;
  modulo?: string;
  accion?: string;
  usuario_id?: number;
  resultado?: string;
  desde?: string;
  hasta?: string;
  page?: number;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  meta: PaginatedItems<AuditLog>["meta"] & {
    modulos_disponibles: string[];
    acciones_disponibles: string[];
  };
}

/**
 * Espejo del payload de App\Services\ReporteService::generarResumen()
 * (2026-08-02, docs/03_FUNCTIONAL_SPEC/Reports.md). "Reportes" es una
 * vista computada, no un recurso paginable — un único fetch trae todas
 * las secciones.
 */
export interface ReporteResumen {
  rango: { desde: string; hasta: string };
  inventario: {
    total_productos: number;
    valor_total_inventario: number;
    productos_stock_bajo: number;
    productos_sin_stock: number;
    productos_por_categoria: { categoria_id: number; categoria: string; total: number }[];
  };
  movimientos: {
    entradas: { total: number; cantidad: number };
    salidas: { total: number; cantidad: number };
    ajustes: { total: number; cantidad: number };
    por_dia: { fecha: string; entradas: number; salidas: number; ajustes: number }[];
    productos_mas_movidos: { producto_id: number; producto: string; total_movimientos: number; cantidad_total: number }[];
  };
  clientes: {
    total_activos: number;
    total_inactivos: number;
    nuevos_ultimos_30_dias: number;
  };
  proveedores: {
    total_activos: number;
    total_inactivos: number;
    top_proveedores: { proveedor_id: number; proveedor: string; total_productos: number }[];
  };
}

export interface ReporteFiltros {
  desde?: string;
  hasta?: string;
}

/**
 * Espejo del catálogo de 13 reportes (ampliación 2026-08-03,
 * docs/03_FUNCTIONAL_SPEC/Reports.md). `filtros_disponibles` es lo que le
 * dice al frontend qué formulario de filtros construir para cada reporte
 * SIN hardcodear supuestos por reporte — agregar un reporte nuevo en el
 * backend nunca requiere tocar esta página.
 */
export interface ReporteFiltroDisponible {
  clave: string;
  etiqueta: string;
  tipo: "select" | "texto" | "fecha";
  requerido: boolean;
}

export interface ReporteCatalogoItem {
  clave: string;
  nombre: string;
  descripcion: string;
  filtros_disponibles: ReporteFiltroDisponible[];
}

export interface ReporteColumna {
  clave: string;
  etiqueta: string;
}

/** Espejo de App\DTO\Report\ReporteResultadoDTO::toArray(). */
export interface ReporteResultado {
  clave: string;
  titulo: string;
  columnas: ReporteColumna[];
  filas: Record<string, string | number | null>[];
  resumen: Record<string, unknown>;
  filtros_aplicados: Record<string, unknown>;
  total: number;
}

export interface ReporteHistorialItem {
  id: number;
  uuid: string;
  tipo_reporte: string;
  formato: string;
  filtros: Record<string, unknown> | null;
  total_filas: number | null;
  created_at: string;
  usuario: { id: number; email: string } | null;
}

export interface ReporteHistorialFiltros {
  tipo_reporte?: string;
  formato?: string;
  desde?: string;
  hasta?: string;
  page?: number;
}

export interface PaginatedReporteHistorial {
  items: ReporteHistorialItem[];
  meta: PaginatedItems<ReporteHistorialItem>["meta"];
}

/** Espejo de App\Http\Resources\Categoria\CategoriaResource (RC1, docs/03_FUNCTIONAL_SPEC/Categories.md). */
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: "activo" | "inactivo";
  productos_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export type StoreCategoriaPayload = Partial<Pick<Categoria, "descripcion" | "estado">> & {
  nombre: string;
};

export type UpdateCategoriaPayload = Partial<StoreCategoriaPayload>;

/** Espejo de App\Http\Resources\Marca\MarcaResource (RC1, docs/03_FUNCTIONAL_SPEC/Brands.md). */
export interface Marca {
  id: number;
  nombre: string;
  estado: "activo" | "inactivo";
  productos_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export type StoreMarcaPayload = Partial<Pick<Marca, "estado">> & {
  nombre: string;
};

export type UpdateMarcaPayload = Partial<StoreMarcaPayload>;

/** Espejo de App\Http\Resources\UnidadMedida\UnidadMedidaResource (RC1, docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). */
export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string | null;
  estado: "activo" | "inactivo";
  productos_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export type StoreUnidadMedidaPayload = Partial<Pick<UnidadMedida, "abreviatura" | "estado">> & {
  nombre: string;
};

export type UpdateUnidadMedidaPayload = Partial<StoreUnidadMedidaPayload>;

/**
 * Espejo de App\Http\Resources\Stock\StockResource (RC1 Fase 2,
 * docs/03_FUNCTIONAL_SPEC/Stock.md). Stock NO es una entidad
 * independiente — es una vista sobre los campos de stock de Producto.
 * `estado` aquí es `stock_estado` (bandera administrativa propia de este
 * módulo), nunca el `estado` de catálogo del producto.
 */
export interface Stock {
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
  estado: "activo" | "inactivo";
  created_at: string | null;
  updated_at: string | null;
}

/** Solo umbrales de alerta — stock_actual nunca es editable desde aquí. */
export interface UpdateStockPayload {
  stock_minimo?: number;
  stock_maximo?: number | null;
}

/**
 * Espejo de App\Http\Resources\Movimiento\MovimientoResource (RC1 Fase 3,
 * docs/03_FUNCTIONAL_SPEC/Movements.md). Registro contable inmutable —
 * cantidad/tipo/producto/proveedor/stock nunca cambian una vez creados.
 */
export interface Movimiento {
  id: number;
  tipo: "entrada" | "salida" | "ajuste" | "conteo" | "transferencia";
  producto_id: number;
  producto: string | null;
  producto_codigo: string | null;
  /** Abreviatura (ej. "kg") — null si el producto no tiene unidad de medida asignada. */
  unidad_medida: string | null;
  usuario: string | null;
  cantidad: number;
  /** stock_nuevo - stock_anterior, con signo. */
  delta: number;
  stock_anterior: number;
  stock_nuevo: number;
  documento: string | null;
  observacion: string | null;
  proveedor: string | null;
  proveedor_id: number | null;
  lote: string | null;
  vencimiento: string | null;
  /**
   * Derivado de la convención `documento === 'captura_ia'` — no hay una
   * columna de origen real todavía. "Importación" no existe como
   * funcionalidad en este ERP, así que nunca aparece como valor aquí.
   */
  origen: "manual" | "captura_ia";
  /** true solo si existe una CapturaIADetalle enlazada con un archivo adjunto real. */
  tiene_evidencia: boolean;
  created_at: string | null;
}

/**
 * Único mecanismo de "Crear" en el módulo global de Movimientos.
 * `direccion` solo aplica (y es obligatorio) cuando `tipo === "ajuste"`;
 * `proveedor_id` solo aplica cuando `tipo === "entrada"`.
 */
export interface StoreMovimientoPayload {
  producto_id: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  direccion?: "incremento" | "decremento";
  costo?: number;
  precio?: number;
  proveedor_id?: number;
  documento?: string;
  observacion?: string;
  lote?: string;
  vencimiento?: string;
}

/** Solo metadata descriptiva — el registro contable nunca es editable. */
export interface UpdateMovimientoPayload {
  documento?: string | null;
  observacion?: string | null;
  lote?: string | null;
  vencimiento?: string | null;
}

/**
 * Espejo de App\Http\Resources\User\UserResource (RC1 Fase 4,
 * docs/03_FUNCTIONAL_SPEC/Users.md, ampliado 2026-08-03). Módulo
 * administrativo — distinto de `AuthenticatedUser` (siempre el propio
 * usuario autenticado). Sin edición de nombre/email desde aquí (pertenece
 * a Perfil); `role` sí es editable vía `asignarRolUsuario()` (Módulo 5,
 * ya construido) — activar/desactivar/asignar rol son las tres únicas
 * mutaciones de este módulo, crear sigue siendo exclusivo de Invitaciones.
 */
/**
 * `empresa`/`is_platform_admin`/`avatar_url`/`theme`/`language`/`timezone`
 * agregados 2026-08-04 (ADR-015). Los primeros dos son Identity (siempre
 * de solo lectura); los últimos cuatro son Operational — antes exclusivos
 * de autoservicio vía Perfil, ahora también editables aquí por un
 * administrador con `usuarios.editar` (ver `UsuarioFormModal`).
 */
export interface Usuario {
  id: number;
  name: string;
  email: string;
  empresa: { id: number; nombre: string } | null;
  is_platform_admin: boolean;
  is_active: boolean;
  avatar_path: string | null;
  avatar_url: string | null;
  theme: "light" | "dark" | "system" | null;
  language: "es" | "en" | null;
  timezone: string | null;
  role: string | null;
  last_activity_at: string | null;
  last_login_ip: string | null;
  last_user_agent: string | null;
  invited_at: string | null;
  invited_by: string | null;
  created_at: string | null;
}

/** Campos Operational editables por un administrador (ADR-015) — `name`/`email` son Identity, nunca aquí. */
export interface UpdateUsuarioPayload {
  theme?: "light" | "dark" | "system";
  language?: "es" | "en";
  timezone?: string;
}

/**
 * Módulo 6 — Invitaciones (2026-08-03, docs/03_FUNCTIONAL_SPEC/Users.md,
 * Decisión 1). Único mecanismo real de alta de usuarios de este ERP.
 */
export interface InviteUsuarioPayload {
  email: string;
  role_id?: number;
}

/** Espejo del payload de InvitationController::show() — datos públicos de una invitación, sin exponer el token en sí. */
export interface InvitacionInfo {
  email: string;
  empresa: string;
  rol: string | null;
}

export interface AcceptInvitationPayload {
  name: string;
  password: string;
  password_confirmation: string;
}

/**
 * Espejo de App\Http\Resources\ProductoProveedor\ProductoProveedorResource
 * (FEATURE-005, docs/03_FUNCTIONAL_SPEC/Suppliers.md) — asociación
 * Producto↔Proveedor con atributos propios (precio de compra, código del
 * proveedor, si es el proveedor principal).
 */
export interface ProductoProveedorAsociacion {
  id: number;
  producto_id: number;
  proveedor_id: number;
  proveedor_nombre: string | null;
  producto_nombre: string | null;
  es_principal: boolean;
  precio_compra: number | null;
  codigo_proveedor: string | null;
  estado: "activo" | "inactivo";
  created_at: string | null;
}

export interface StoreProductoProveedorPayload {
  proveedor_id: number;
  es_principal?: boolean;
  precio_compra?: number | null;
  codigo_proveedor?: string | null;
}

export type UpdateProductoProveedorPayload = Partial<
  Omit<StoreProductoProveedorPayload, "proveedor_id">
>;

/** Espejo de App\Http\Resources\Movimiento\MovimientoResource. */
export interface MovimientoProducto {
  id: number;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  documento: string | null;
  observacion: string | null;
  proveedor: string | null;
  proveedor_id: number | null;
  lote: string | null;
  vencimiento: string | null;
  created_at: string | null;
}
