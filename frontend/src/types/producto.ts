export interface Producto {
  id: number;
  codigo: string | null;
  codigo_barras: string | null;
  nombre: string;
  marca_id: number | null;
  marca: string | null;
  descripcion: string | null;
  presentacion: string | null;
  categoria_id: number | null;
  categoria: string | null;
  costo: number;
  precio: number;
  unidad_medida_id: number | null;
  unidad_medida: string | null;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  imagen: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface ProductosQueryParams {
  busqueda?: string;
  estado?: "activo" | "todos";
  categoria_id?: number;
  per_page?: 10 | 25 | 50 | 100;
  page?: number;
}

/** Matches StoreProductoRequest. `codigo`/`codigo_barras` settable only here — absent from
 * UpdateProductoRequest entirely (verified against the real Request, not assumed), same
 * Identity-field shape as NIT/email on Proveedores/Clientes. `marca_nuevo`/`unidad_medida_nuevo`
 * quick-create a new Marca/UnidadMedida on the fly; mutually exclusive with their *_id
 * counterpart. `stock_actual` is never sent — `['prohibited']` on the backend, always starts
 * at 0. */
export interface CreateProductoPayload {
  nombre: string;
  codigo?: string | null;
  codigo_barras?: string | null;
  marca_id?: number | null;
  marca_nuevo?: string | null;
  descripcion?: string | null;
  presentacion?: string | null;
  categoria_id?: number | null;
  costo?: number;
  precio?: number;
  unidad_medida_id?: number | null;
  unidad_medida_nuevo?: string | null;
  stock_minimo?: number;
  stock_maximo?: number | null;
}

/** Matches UpdateProductoRequest — codigo/codigo_barras/estado deliberately excluded
 * (identity/controlled fields, same reasoning as create). */
export interface UpdateProductoPayload {
  nombre?: string;
  marca_id?: number | null;
  marca_nuevo?: string | null;
  descripcion?: string | null;
  presentacion?: string | null;
  categoria_id?: number | null;
  costo?: number;
  precio?: number;
  unidad_medida_id?: number | null;
  unidad_medida_nuevo?: string | null;
  stock_minimo?: number;
  stock_maximo?: number | null;
}

/** Matches MovimientoResource — read-only, shown in the Movimientos tab of the Ficha. */
export interface ProductoMovimiento {
  id: number;
  tipo: string;
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

/** Matches StoreIngresoRequest ("Registrar ingreso" desde la Ficha). proveedor_id/proveedor_nuevo
 * mutually exclusive, same quick-create pattern as marca/unidad_medida. */
export interface RegistrarIngresoPayload {
  cantidad: number;
  costo?: number | null;
  proveedor_id?: number | null;
  proveedor_nuevo?: string | null;
  documento?: string | null;
  observacion?: string | null;
  lote?: string | null;
  vencimiento?: string | null;
}
